import { prisma } from "@/lib/prisma";
import { computeReadiness, readinessLevel, READINESS_LEVEL_LABEL, type SkillWeight, type StudentSkillScore } from "@/lib/engine/readiness";
import { computeSkillGaps, type SkillGap } from "@/lib/engine/skillGap";
import type { Priority } from "@prisma/client";

export interface StudentReadinessRow {
  studentId: string;
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  departmentId: string;
  departmentName: string;
  year: number;
  targetRole: string | null;
  readiness: number | null;
  level: string | null;
  confidence: number | null;
  primaryGap: string | null;
  primaryGapPriority: Priority | null;
  lastActivityAt: Date | null;
  profileCompletion: number;
}

interface ComputedStudent {
  studentId: string;
  readiness: ReturnType<typeof computeReadiness>;
  gaps: SkillGap[];
}

/**
 * Computes readiness + skill gaps for every student with a target role in a
 * small, constant number of queries (rather than one round trip per
 * student) — role weights and student skills are fetched in bulk once and
 * joined in memory using the same deterministic engine the student
 * dashboard uses, so faculty and student-facing numbers can never disagree.
 */
async function computeAllStudentProfiles(): Promise<Map<string, ComputedStudent>> {
  const [students, allSkillRows, allRoleWeightRows] = await Promise.all([
    prisma.student.findMany({ where: { preferredRoleId: { not: null } }, select: { id: true, preferredRoleId: true } }),
    prisma.studentSkill.findMany(),
    prisma.jobRoleSkill.findMany({ include: { skill: true } }),
  ]);

  const skillsByStudent = new Map<string, StudentSkillScore[]>();
  for (const row of allSkillRows) {
    const list = skillsByStudent.get(row.studentId) ?? [];
    list.push({ skillId: row.skillId, currentScore: row.currentScore, dataPoints: row.dataPoints });
    skillsByStudent.set(row.studentId, list);
  }

  const trendsByStudent = new Map<string, { skillId: string; trend: number }[]>();
  for (const row of allSkillRows) {
    const list = trendsByStudent.get(row.studentId) ?? [];
    list.push({ skillId: row.skillId, trend: row.previousScore != null ? row.currentScore - row.previousScore : 0 });
    trendsByStudent.set(row.studentId, list);
  }

  const weightsByRole = new Map<string, SkillWeight[]>();
  for (const row of allRoleWeightRows) {
    const list = weightsByRole.get(row.jobRoleId) ?? [];
    list.push({ skillId: row.skillId, skillName: row.skill.name, weight: row.weight, minimumTarget: row.minimumTarget });
    weightsByRole.set(row.jobRoleId, list);
  }

  const results = new Map<string, ComputedStudent>();
  for (const s of students) {
    if (!s.preferredRoleId) continue;
    const roleWeights = weightsByRole.get(s.preferredRoleId) ?? [];
    if (roleWeights.length === 0) continue;
    const studentSkills = skillsByStudent.get(s.id) ?? [];
    const trends = trendsByStudent.get(s.id) ?? [];

    results.set(s.id, {
      studentId: s.id,
      readiness: computeReadiness(studentSkills, roleWeights),
      gaps: computeSkillGaps(studentSkills, roleWeights, trends),
    });
  }
  return results;
}

export async function getAllStudentReadinessRows(): Promise<StudentReadinessRow[]> {
  const [students, computed, lastActivityRows] = await Promise.all([
    prisma.student.findMany({ include: { user: true, department: true, preferredRole: true } }),
    computeAllStudentProfiles(),
    prisma.progressRecord.groupBy({ by: ["studentId"], _max: { recordedAt: true } }),
  ]);

  const lastActivityByStudent = new Map(lastActivityRows.map((r) => [r.studentId, r._max.recordedAt]));

  return students.map((s) => {
    const c = computed.get(s.id);
    const topGap = c?.gaps.find((g) => g.gap > 0) ?? null;
    return {
      studentId: s.id,
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      rollNumber: s.rollNumber,
      departmentId: s.departmentId,
      departmentName: s.department.name,
      year: s.year,
      targetRole: s.preferredRole?.name ?? null,
      readiness: c?.readiness.score ?? null,
      level: c ? READINESS_LEVEL_LABEL[readinessLevel(c.readiness.score)] : null,
      confidence: c?.readiness.confidence ?? null,
      primaryGap: topGap?.skillName ?? null,
      primaryGapPriority: topGap?.priority ?? null,
      lastActivityAt: lastActivityByStudent.get(s.id) ?? null,
      profileCompletion: s.profileCompletion,
    };
  });
}

export interface FacultyOverview {
  totalStudents: number;
  averageReadiness: number;
  placementReadyCount: number;
  needsSupportCount: number;
  skillGapDistribution: { skill: string; belowTargetPercent: number }[];
  departmentBreakdown: { department: string; averageReadiness: number; studentCount: number }[];
}

export async function getFacultyOverview(): Promise<FacultyOverview> {
  const [students, computed] = await Promise.all([
    prisma.student.findMany({ where: { preferredRoleId: { not: null } }, include: { department: true } }),
    computeAllStudentProfiles(),
  ]);

  const readinessScores: number[] = [];
  let placementReady = 0;
  let needsSupport = 0;
  const skillTally = new Map<string, { below: number; total: number }>();
  const deptTally = new Map<string, { sum: number; count: number }>();

  for (const s of students) {
    const c = computed.get(s.id);
    if (!c) continue;
    const score = c.readiness.score;
    readinessScores.push(score);
    if (score >= 75) placementReady++;
    if (score < 60) needsSupport++;

    for (const gap of c.gaps) {
      const entry = skillTally.get(gap.skillName) ?? { below: 0, total: 0 };
      entry.total++;
      if (gap.gap > 0) entry.below++;
      skillTally.set(gap.skillName, entry);
    }

    const deptEntry = deptTally.get(s.department.name) ?? { sum: 0, count: 0 };
    deptEntry.sum += score;
    deptEntry.count++;
    deptTally.set(s.department.name, deptEntry);
  }

  const averageReadiness =
    readinessScores.length > 0
      ? Math.round((readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length) * 10) / 10
      : 0;

  const skillGapDistribution = [...skillTally.entries()]
    .map(([skill, { below, total }]) => ({
      skill,
      belowTargetPercent: total > 0 ? Math.round((below / total) * 100) : 0,
    }))
    .sort((a, b) => b.belowTargetPercent - a.belowTargetPercent);

  const departmentBreakdown = [...deptTally.entries()].map(([department, { sum, count }]) => ({
    department,
    averageReadiness: Math.round((sum / count) * 10) / 10,
    studentCount: count,
  }));

  return {
    totalStudents: students.length,
    averageReadiness,
    placementReadyCount: placementReady,
    needsSupportCount: needsSupport,
    skillGapDistribution,
    departmentBreakdown,
  };
}
