import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { computeStudentProfile } from "@/lib/services/skillEngine";
import { answerStudentQuestion, type CoachContext } from "@/lib/ai/aiService";
import { readinessLevel, READINESS_LEVEL_LABEL } from "@/lib/engine/readiness";

const bodySchema = z.object({ question: z.string().min(1).max(500) });

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");
  const { question } = bodySchema.parse(await req.json());

  const profile = await computeStudentProfile(session.profileId);
  if (!profile) {
    throw new ApiError(
      400,
      "Select a target job role on your profile so the AI Coach can use your actual data."
    );
  }

  const level = readinessLevel(profile.readiness.score);
  const declining = profile.gaps.find((g) => g.trend < -2);

  const ctx: CoachContext = {
    targetRole: profile.targetRoleName,
    readinessScore: profile.readiness.score,
    readinessLevel: READINESS_LEVEL_LABEL[level],
    confidence: profile.readiness.confidence,
    skills: profile.readiness.breakdown.map((b) => ({ name: b.skillName, current: b.score, target: b.target })),
    topGaps: profile.gaps.filter((g) => g.gap > 0).slice(0, 3).map((g) => ({ name: g.skillName, gap: g.gap })),
    recentTrend: declining
      ? `Your ${declining.skillName} score has recently dropped by about ${Math.abs(declining.trend).toFixed(1)} points.`
      : undefined,
  };

  const { source, data } = await answerStudentQuestion(question, ctx);

  return NextResponse.json({ source, answer: data });
});
