import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { getLatestRecommendation, generateAndStoreRecommendation } from "@/lib/services/recommendationService";

export const GET = withErrorHandling(async () => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  let recommendation = await getLatestRecommendation(session.profileId);

  // Auto-generate a first recommendation so the dashboard is never empty
  // for a student who already has a target role and some skill data.
  if (!recommendation) {
    recommendation = await generateAndStoreRecommendation(session.profileId);
  }

  return NextResponse.json({ recommendation });
});
