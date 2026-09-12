import { prisma } from "@/lib/prisma";

export interface StudentProgress {
  readinessHistory: { date: string; score: number; confidence: number }[];
  skillProgress: { skillName: string; points: { date: string; score: number }[] }[];
  assessmentHistory: {
    id: string;
    title: string;
    skill: string;
    percentage: number | null;
    previousPercentage: number | null;
    improvementPct: number | null;
    submittedAt: Date | null;
  }[];
  recommendationStats: { total: number; started: number; completed: number; completionRate: number };
  practiceStreak: number;
  totalPracticeSessions: number;
}

export async function getStudentProgress(studentId: string): Promise<StudentProgress> {
  const [readinessHistory, skillProgress, attempts, recommendations, practiceSessions] =
    await Promise.all([
      prisma.readinessSnapshot.findMany({ where: { studentId }, orderBy: { createdAt: "asc" }, take: 50 }),
      prisma.progressRecord.findMany({
        where: { studentId, skillId: { not: null } },
        include: { skill: true },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.assessmentAttempt.findMany({
        where: { studentId, submittedAt: { not: null } },
        include: { assessment: { include: { skill: true } } },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
      prisma.recommendation.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.practiceSession.findMany({ where: { studentId }, orderBy: { completedAt: "desc" }, take: 30 }),
    ]);

  const bySkill: Record<string, { skillName: string; points: { date: string; score: number }[] }> = {};
  for (const record of skillProgress) {
    if (!record.skill) continue;
    if (!bySkill[record.skillId!]) bySkill[record.skillId!] = { skillName: record.skill.name, points: [] };
    bySkill[record.skillId!].points.push({ date: record.recordedAt.toISOString(), score: record.score });
  }

  const activityDates = new Set(
    [...practiceSessions.map((p) => p.completedAt), ...attempts.map((a) => a.submittedAt!).filter(Boolean)].map(
      (d) => d.toISOString().slice(0, 10)
    )
  );
  let streak = 0;
  const cursor = new Date();
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!activityDates.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (activityDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const completedRecs = recommendations.filter((r) => r.status === "COMPLETED");
  const startedRecs = recommendations.filter((r) => r.status !== "GENERATED");

  return {
    readinessHistory: readinessHistory.map((r) => ({
      date: r.createdAt.toISOString(),
      score: r.score,
      confidence: r.confidence,
    })),
    skillProgress: Object.values(bySkill),
    assessmentHistory: attempts.map((a) => ({
      id: a.id,
      title: a.assessment.title,
      skill: a.assessment.skill.name,
      percentage: a.percentage,
      previousPercentage: a.previousPercentage,
      improvementPct: a.improvementPct,
      submittedAt: a.submittedAt,
    })),
    recommendationStats: {
      total: recommendations.length,
      started: startedRecs.length,
      completed: completedRecs.length,
      completionRate:
        recommendations.length > 0 ? Math.round((completedRecs.length / recommendations.length) * 100) : 0,
    },
    practiceStreak: streak,
    totalPracticeSessions: practiceSessions.length,
  };
}
