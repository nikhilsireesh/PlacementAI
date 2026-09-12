import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { markRecommendationStatus } from "@/lib/services/recommendationService";

const bodySchema = z.object({
  status: z.enum(["OPENED", "STARTED", "COMPLETED", "DISMISSED"]),
  feedbackRating: z.number().int().min(1).max(5).optional(),
  feedbackComment: z.string().max(500).optional(),
});

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await requireSession(["STUDENT"]);
    if (!session.profileId) throw new ApiError(404, "Student profile not found.");
    const { id } = await params;
    const body = bodySchema.parse(await req.json());

    const updated = await markRecommendationStatus(id, session.profileId, body.status, {
      feedbackRating: body.feedbackRating,
      feedbackComment: body.feedbackComment,
    });
    if (!updated) throw new ApiError(404, "Recommendation not found.");

    return NextResponse.json({ recommendation: updated });
  }
);
