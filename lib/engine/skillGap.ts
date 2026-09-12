import type { Priority } from "@prisma/client";
import type { SkillWeight, StudentSkillScore } from "./readiness";

export interface SkillTrend {
  skillId: string;
  /** positive = improving, negative = declining, 0 = flat/unknown */
  trend: number;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  current: number;
  target: number;
  gap: number; // target - current, floored at 0
  weight: number;
  dataPoints: number;
  trend: number;
  priorityScore: number;
  priority: Priority;
}

/**
 * Deterministic skill-gap identification.
 *
 * priorityScore = gap × roleWeight × trendFactor × confidenceFactor
 *
 * - gap: how far below target the student currently is (0 if at/above target)
 * - roleWeight: how much this skill matters for the student's target role
 * - trendFactor: 1.2 if declining, 1.0 if flat, 0.85 if already improving
 *   (an improving skill is being addressed already, so it's slightly deprioritized)
 * - confidenceFactor: scales down priority when there isn't enough data yet,
 *   so the engine doesn't over-react to a single low score
 */
export function computeSkillGaps(
  studentSkills: StudentSkillScore[],
  roleWeights: SkillWeight[],
  trends: SkillTrend[] = []
): SkillGap[] {
  const skillMap = new Map(studentSkills.map((s) => [s.skillId, s]));
  const trendMap = new Map(trends.map((t) => [t.skillId, t.trend]));
  const totalWeight = roleWeights.reduce((sum, r) => sum + r.weight, 0) || 1;

  const gaps: SkillGap[] = roleWeights.map((rw) => {
    const studentSkill = skillMap.get(rw.skillId);
    const current = studentSkill?.currentScore ?? 0;
    const dataPoints = studentSkill?.dataPoints ?? 0;
    const gap = Math.max(0, rw.minimumTarget - current);
    const normalizedWeight = rw.weight / totalWeight;
    const trend = trendMap.get(rw.skillId) ?? 0;

    const trendFactor = trend < -2 ? 1.2 : trend > 2 ? 0.85 : 1.0;
    const confidenceFactor = Math.min(1, 0.4 + dataPoints * 0.2); // 0.4 -> 1.0 by 3 data points

    const priorityScore = gap * normalizedWeight * trendFactor * confidenceFactor;

    return {
      skillId: rw.skillId,
      skillName: rw.skillName,
      current,
      target: rw.minimumTarget,
      gap: Math.round(gap * 10) / 10,
      weight: normalizedWeight,
      dataPoints,
      trend,
      priorityScore: Math.round(priorityScore * 100) / 100,
      priority: "LOW" as Priority,
    };
  });

  gaps.sort((a, b) => b.priorityScore - a.priorityScore);

  // Bucket into HIGH / MEDIUM / LOW relative to this student's own gaps,
  // rather than a fixed global cutoff — the highest-impact gap is always HIGH
  // (if any gap exists), the next tier is MEDIUM, and small residual gaps are LOW.
  const maxScore = gaps[0]?.priorityScore ?? 0;
  for (const g of gaps) {
    if (g.gap <= 0.5) {
      g.priority = "LOW";
    } else if (maxScore > 0 && g.priorityScore >= maxScore * 0.6) {
      g.priority = "HIGH";
    } else if (maxScore > 0 && g.priorityScore >= maxScore * 0.25) {
      g.priority = "MEDIUM";
    } else {
      g.priority = "LOW";
    }
  }

  return gaps;
}
