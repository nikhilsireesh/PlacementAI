import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { computeStudentProfile } from "@/lib/services/skillEngine";
import { generateRoadmap } from "@/lib/ai/aiService";

const bodySchema = z.object({ days: z.number().int().min(3).max(30).default(14) });

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");
  const { days } = bodySchema.parse(await req.json().catch(() => ({})));

  const profile = await computeStudentProfile(session.profileId);
  if (!profile) {
    throw new ApiError(400, "Select a target job role on your profile to generate a roadmap.");
  }

  const { source, data } = await generateRoadmap(profile.gaps, profile.targetRoleName, days);

  return NextResponse.json({ source, targetRole: profile.targetRoleName, roadmap: data });
});
