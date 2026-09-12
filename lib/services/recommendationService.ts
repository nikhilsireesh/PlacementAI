import { prisma } from "@/lib/prisma";
import { generateRecommendation } from "@/lib/ai/aiService";
import { computeStudentProfile } from "./skillEngine";
import type { Recommendation } from "@prisma/client";

/**
 * The Next Best Action Engine's entry point: recomputes the student's
 * current skill gaps and produces a fresh recommendation (AI-personalized
 * when available, deterministic fallback otherwise), then persists it.
 */
export async function generateAndStoreRecommendation(
  studentId: string
): Promise<Recommendation | null> {
  const profile = await computeStudentProfile(studentId);
  if (!profile) return null;

  const recentCompleted = await prisma.recommendation.findMany({
    where: { studentId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 5,
    select: { nextBestAction: true },
  });

  const result = await generateRecommendation(
    profile.gaps,
    profile.targetRoleName,
    recentCompleted.map((r) => r.nextBestAction)
  );

  const primaryGapSkill = profile.gaps.find((g) => g.skillName === result.data.primary_gap);

  const created = await prisma.recommendation.create({
    data: {
      studentId,
      primaryGap: result.data.primary_gap,
      secondaryGap: result.data.secondary_gap,
      reason: result.data.reason,
      nextBestAction: result.data.next_best_action,
      practiceType: result.data.practice_type,
      estimatedMinutes: result.data.estimated_minutes,
      priority: result.data.priority,
      learningTopics: result.data.learning_topics as unknown as object,
      successMetric: result.data.success_metric,
      source: result.source,
      status: "GENERATED",
      skillScoreBefore: primaryGapSkill?.current ?? null,
    },
  });

  return created;
}

export async function getLatestRecommendation(studentId: string) {
  return prisma.recommendation.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markRecommendationStatus(
  recommendationId: string,
  studentId: string,
  status: "OPENED" | "STARTED" | "COMPLETED" | "DISMISSED",
  extra?: { feedbackRating?: number; feedbackComment?: string; skillScoreAfter?: number }
) {
  const owned = await prisma.recommendation.findFirst({
    where: { id: recommendationId, studentId },
    select: { id: true },
  });
  if (!owned) return null;

  const timestampField =
    status === "OPENED" ? "openedAt" : status === "STARTED" ? "startedAt" : status === "COMPLETED" ? "completedAt" : undefined;

  return prisma.recommendation.update({
    where: { id: recommendationId },
    data: {
      status,
      ...(timestampField ? { [timestampField]: new Date() } : {}),
      ...(extra?.feedbackRating != null ? { feedbackRating: extra.feedbackRating } : {}),
      ...(extra?.feedbackComment != null ? { feedbackComment: extra.feedbackComment } : {}),
      ...(extra?.skillScoreAfter != null ? { skillScoreAfter: extra.skillScoreAfter } : {}),
    },
  });
}
