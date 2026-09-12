import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling } from "@/lib/apiUtils";
import { pickInterviewQuestions } from "@/lib/data/interviewQuestions";

const querySchema = z.object({
  type: z.enum(["HR", "TECHNICAL", "BEHAVIORAL"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
});

export const GET = withErrorHandling(async (req: Request) => {
  await requireSession(["STUDENT"]);
  const { searchParams } = new URL(req.url);
  const { type, difficulty } = querySchema.parse({
    type: searchParams.get("type"),
    difficulty: searchParams.get("difficulty") ?? undefined,
  });

  const questions = pickInterviewQuestions(type, difficulty, 3);
  return NextResponse.json({ questions });
});
