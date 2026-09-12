import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { computeStudentProfile } from "@/lib/services/skillEngine";
import { readinessLevel, READINESS_LEVEL_LABEL } from "@/lib/engine/readiness";

export const GET = withErrorHandling(async () => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const profile = await computeStudentProfile(session.profileId);
  if (!profile) {
    return NextResponse.json({
      hasTargetRole: false,
      message: "Select a target job role on your profile to see your placement readiness score.",
    });
  }

  const level = readinessLevel(profile.readiness.score);

  return NextResponse.json({
    hasTargetRole: true,
    targetRole: profile.targetRoleName,
    score: profile.readiness.score,
    level,
    levelLabel: READINESS_LEVEL_LABEL[level],
    confidence: profile.readiness.confidence,
    breakdown: profile.readiness.breakdown,
  });
});
