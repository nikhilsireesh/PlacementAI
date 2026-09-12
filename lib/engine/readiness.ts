/**
 * Deterministic readiness scoring.
 *
 * The placement readiness score is NEVER computed by AI — it is a plain
 * weighted sum so it stays explainable and auditable:
 *
 *   readiness = Σ (skillScore × roleWeight)
 *
 * Weights come from `JobRoleSkill` rows in the database (configurable by
 * faculty/admin per job role), not from hard-coded frontend constants.
 */

export interface SkillWeight {
  skillId: string;
  skillName: string;
  weight: number; // 0..1
  minimumTarget: number; // 0..100
}

export interface StudentSkillScore {
  skillId: string;
  currentScore: number; // 0..100
  dataPoints: number;
}

export interface ReadinessBreakdownEntry {
  skillId: string;
  skillName: string;
  score: number;
  weight: number;
  weighted: number;
  target: number;
}

export interface ReadinessResult {
  score: number; // 0..100, rounded to 1 decimal
  confidence: number; // 0..100
  breakdown: ReadinessBreakdownEntry[];
}

export type ReadinessLevel =
  | "EXCELLENT"
  | "PLACEMENT_READY"
  | "NEEDS_IMPROVEMENT"
  | "AT_RISK"
  | "CRITICAL_GAP";

export function computeReadiness(
  studentSkills: StudentSkillScore[],
  roleWeights: SkillWeight[]
): ReadinessResult {
  const skillMap = new Map(studentSkills.map((s) => [s.skillId, s]));

  // Normalize weights in case they don't sum to exactly 1 (defensive —
  // faculty-configured weights should sum to 1 but we don't trust that blindly).
  const totalWeight = roleWeights.reduce((sum, r) => sum + r.weight, 0) || 1;

  const breakdown: ReadinessBreakdownEntry[] = roleWeights.map((rw) => {
    const normalizedWeight = rw.weight / totalWeight;
    const studentSkill = skillMap.get(rw.skillId);
    const score = studentSkill?.currentScore ?? 0;
    return {
      skillId: rw.skillId,
      skillName: rw.skillName,
      score,
      weight: normalizedWeight,
      weighted: score * normalizedWeight,
      target: rw.minimumTarget,
    };
  });

  const rawScore = breakdown.reduce((sum, b) => sum + b.weighted, 0);
  const score = Math.round(rawScore * 10) / 10;

  const confidence = computeConfidence(studentSkills, roleWeights);

  return { score, confidence, breakdown };
}

/**
 * Confidence reflects how much real assessment data backs the readiness
 * score — a student with one attempt per skill should not be told their
 * readiness is precisely known.
 */
export function computeConfidence(
  studentSkills: StudentSkillScore[],
  roleWeights: SkillWeight[]
): number {
  if (roleWeights.length === 0) return 0;
  const skillMap = new Map(studentSkills.map((s) => [s.skillId, s]));

  // Each relevant skill contributes up to 100% confidence once it has
  // 3+ data points (assessments/practice sessions); scales linearly below that.
  const TARGET_DATA_POINTS = 3;
  const perSkillConfidence = roleWeights.map((rw) => {
    const dp = skillMap.get(rw.skillId)?.dataPoints ?? 0;
    return Math.min(1, dp / TARGET_DATA_POINTS);
  });

  const avg =
    perSkillConfidence.reduce((a, b) => a + b, 0) / perSkillConfidence.length;
  return Math.round(avg * 100);
}

export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "PLACEMENT_READY";
  if (score >= 60) return "NEEDS_IMPROVEMENT";
  if (score >= 40) return "AT_RISK";
  return "CRITICAL_GAP";
}

export const READINESS_LEVEL_LABEL: Record<ReadinessLevel, string> = {
  EXCELLENT: "Excellent",
  PLACEMENT_READY: "Placement Ready",
  NEEDS_IMPROVEMENT: "Needs Improvement",
  AT_RISK: "At Risk",
  CRITICAL_GAP: "Critical Gap",
};

export const READINESS_LEVEL_COLOR: Record<ReadinessLevel, string> = {
  EXCELLENT: "emerald",
  PLACEMENT_READY: "emerald",
  NEEDS_IMPROVEMENT: "amber",
  AT_RISK: "rose",
  CRITICAL_GAP: "rose",
};
