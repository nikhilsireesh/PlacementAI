import type { Recommendation } from "@prisma/client";

export interface RecommendationDto {
  id: string;
  primaryGap: string;
  secondaryGap: string | null;
  reason: string;
  nextBestAction: string;
  practiceType: string;
  estimatedMinutes: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  learningTopics: string[];
  successMetric: string;
  source: "AI" | "FALLBACK";
  status: string;
}

/** Converts a Prisma Recommendation row (whose `learningTopics` field is an
 * untyped JSON column) into the plain DTO the UI expects. Kept in a plain
 * (non "use client") module so server components can call it directly. */
export function toRecommendationDto(rec: Recommendation): RecommendationDto {
  return {
    id: rec.id,
    primaryGap: rec.primaryGap,
    secondaryGap: rec.secondaryGap,
    reason: rec.reason,
    nextBestAction: rec.nextBestAction,
    practiceType: rec.practiceType,
    estimatedMinutes: rec.estimatedMinutes,
    priority: rec.priority,
    learningTopics: Array.isArray(rec.learningTopics) ? (rec.learningTopics as string[]) : [],
    successMetric: rec.successMetric,
    source: rec.source,
    status: rec.status,
  };
}
