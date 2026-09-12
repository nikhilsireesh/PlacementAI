import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { generateAndStoreRecommendation } from "@/lib/services/recommendationService";

export const POST = withErrorHandling(async () => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const recommendation = await generateAndStoreRecommendation(session.profileId);
  if (!recommendation) {
    throw new ApiError(
      400,
      "Select a target job role on your profile before generating a recommendation."
    );
  }

  return NextResponse.json({ recommendation });
});
