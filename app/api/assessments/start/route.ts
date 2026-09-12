import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ assessmentId: z.string().min(1) });

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");
  const { assessmentId } = bodySchema.parse(await req.json());

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: true },
  });
  if (!assessment) throw new ApiError(404, "Assessment not found.");

  const attempt = await prisma.assessmentAttempt.create({
    data: { studentId: session.profileId, assessmentId },
  });

  // Never send correctAnswer / explanation to the client before submission.
  const questions = assessment.questions.map((q) => ({
    id: q.id,
    type: q.type,
    text: q.text,
    options: q.options,
    marks: q.marks,
    difficulty: q.difficulty,
    topic: q.topic,
  }));

  return NextResponse.json({
    attemptId: attempt.id,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      timeLimitMinutes: assessment.timeLimitMinutes,
      totalMarks: assessment.totalMarks,
    },
    questions,
  });
});
