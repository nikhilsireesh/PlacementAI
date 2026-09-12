import { prisma } from "@/lib/prisma";
import {
  computeReadiness,
  type SkillWeight,
  type StudentSkillScore,
  type ReadinessResult,
} from "@/lib/engine/readiness";
import { computeSkillGaps, type SkillGap, type SkillTrend } from "@/lib/engine/skillGap";

export async function getRoleWeights(jobRoleId: string): Promise<SkillWeight[]> {
  const rows = await prisma.jobRoleSkill.findMany({
    where: { jobRoleId },
    include: { skill: true },
  });
  return rows.map((r) => ({
    skillId: r.skillId,
    skillName: r.skill.name,
    weight: r.weight,
    minimumTarget: r.minimumTarget,
  }));
}

export async function getStudentSkillScores(studentId: string): Promise<StudentSkillScore[]> {
  const rows = await prisma.studentSkill.findMany({ where: { studentId } });
  return rows.map((r) => ({
    skillId: r.skillId,
    currentScore: r.currentScore,
    dataPoints: r.dataPoints,
  }));
}

export async function getStudentTrends(studentId: string): Promise<SkillTrend[]> {
  const rows = await prisma.studentSkill.findMany({ where: { studentId } });
  return rows.map((r) => ({
    skillId: r.skillId,
    trend: r.previousScore != null ? r.currentScore - r.previousScore : 0,
  }));
}

export interface StudentReadinessProfile {
  readiness: ReadinessResult;
  gaps: SkillGap[];
  targetRoleId: string;
  targetRoleName: string;
}

/** Full deterministic readiness + skill-gap profile for a student. Returns
 * null if the student hasn't selected a target job role yet. */
export async function computeStudentProfile(
  studentId: string
): Promise<StudentReadinessProfile | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { preferredRole: true },
  });
  if (!student || !student.preferredRoleId || !student.preferredRole) return null;

  const [roleWeights, studentSkills, trends] = await Promise.all([
    getRoleWeights(student.preferredRoleId),
    getStudentSkillScores(studentId),
    getStudentTrends(studentId),
  ]);

  if (roleWeights.length === 0) return null;

  const readiness = computeReadiness(studentSkills, roleWeights);
  const gaps = computeSkillGaps(studentSkills, roleWeights, trends);

  return {
    readiness,
    gaps,
    targetRoleId: student.preferredRoleId,
    targetRoleName: student.preferredRole.name,
  };
}

/** Records a readiness snapshot only if the most recent one is missing or
 * more than `maxAgeMs` old — keeps the Progress-page history growing on
 * dashboard visits without writing a row on every single page load. */
export async function recordReadinessSnapshotIfStale(
  studentId: string,
  readiness: ReadinessResult,
  maxAgeMs = 1000 * 60 * 60 * 12
) {
  const lastSnapshot = await prisma.readinessSnapshot.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  const staleOrMissing = !lastSnapshot || Date.now() - lastSnapshot.createdAt.getTime() > maxAgeMs;
  if (staleOrMissing) await recordReadinessSnapshot(studentId, readiness);
}

export async function recordReadinessSnapshot(
  studentId: string,
  readiness: ReadinessResult
) {
  await prisma.readinessSnapshot.create({
    data: {
      studentId,
      score: readiness.score,
      confidence: readiness.confidence,
      breakdown: readiness.breakdown as unknown as object,
    },
  });
  await prisma.progressRecord.create({
    data: { studentId, score: readiness.score, source: "readiness" },
  });
}

/**
 * Applies a new observed score for a skill (from an assessment or practice
 * session) using an exponential moving average so a single bad/good result
 * doesn't swing the score wildly, while still being responsive to real change.
 */
export async function applySkillUpdate(
  studentId: string,
  skillId: string,
  observedScore: number,
  source: "assessment" | "practice"
): Promise<{ before: number; after: number }> {
  const existing = await prisma.studentSkill.findUnique({
    where: { studentId_skillId: { studentId, skillId } },
  });

  const before = existing?.currentScore ?? 0;
  const hasHistory = (existing?.dataPoints ?? 0) > 0;
  const blended = hasHistory ? before * 0.4 + observedScore * 0.6 : observedScore;
  const after = Math.round(blended * 10) / 10;

  await prisma.studentSkill.upsert({
    where: { studentId_skillId: { studentId, skillId } },
    create: {
      studentId,
      skillId,
      currentScore: after,
      previousScore: null,
      dataPoints: 1,
      lastAssessedAt: new Date(),
    },
    update: {
      currentScore: after,
      previousScore: before,
      dataPoints: { increment: 1 },
      lastAssessedAt: new Date(),
    },
  });

  await prisma.progressRecord.create({
    data: { studentId, skillId, score: after, source },
  });

  return { before, after };
}
