import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { computeStudentProfile } from "@/lib/services/skillEngine";

export const GET = withErrorHandling(async () => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const profile = await computeStudentProfile(session.profileId);
  if (!profile) {
    return NextResponse.json({ hasTargetRole: false, gaps: [] });
  }

  return NextResponse.json({
    hasTargetRole: true,
    targetRole: profile.targetRoleName,
    gaps: profile.gaps,
  });
});
