import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import { applySkillUpdate, computeStudentProfile, recordReadinessSnapshot } from "@/lib/services/skillEngine";
import { generateAndStoreRecommendation } from "@/lib/services/recommendationService";
import { gradeAnswers } from "@/lib/services/grading";

const bodySchema = z.object({
  attemptId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), answerText: z.string().max(2000) })),
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");
  const body = bodySchema.parse(await req.json());

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: body.attemptId },
    include: { assessment: { include: { questions: true } } },
  });
  if (!attempt || attempt.studentId !== session.profileId) {
    throw new ApiError(404, "Assessment attempt not found.");
  }
  if (attempt.submittedAt) throw new ApiError(400, "This attempt has already been submitted.");

  const { rawScore, totalMarks, percentage, answers: answerRows } = gradeAnswers(
    attempt.assessment.questions,
    body.answers
  );

  const previousAttempt = await prisma.assessmentAttempt.findFirst({
    where: {
      studentId: session.profileId,
      assessmentId: attempt.assessmentId,
      submittedAt: { not: null },
      id: { not: attempt.id },
    },
    orderBy: { submittedAt: "desc" },
  });
  const previousPercentage = previousAttempt?.percentage ?? null;
  const improvementPct =
    previousPercentage != null ? Math.round((percentage - previousPercentage) * 10) / 10 : null;

  await prisma.$transaction([
    ...answerRows.map((a) =>
      prisma.assessmentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: a.questionId,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
          marksAwarded: a.marksAwarded,
        },
      })
    ),
    prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        rawScore,
        totalMarks,
        percentage,
        previousPercentage,
        improvementPct,
      },
    }),
  ]);

  const { before, after } = await applySkillUpdate(
    session.profileId,
    attempt.assessment.skillId,
    percentage,
    "assessment"
  );

  // Recalculate readiness + regenerate the Next Best Action so the dashboard
  // reflects this attempt immediately (the ASSESS -> REASSESS loop).
  const profile = await computeStudentProfile(session.profileId);
  if (profile) await recordReadinessSnapshot(session.profileId, profile.readiness);
  const recommendation = await generateAndStoreRecommendation(session.profileId);

  // Award a simple milestone badge on a student's very first submitted assessment.
  const attemptCount = await prisma.assessmentAttempt.count({
    where: { studentId: session.profileId, submittedAt: { not: null } },
  });
  if (attemptCount === 1) {
    await prisma.studentBadge.upsert({
      where: { studentId_code: { studentId: session.profileId, code: "FIRST_ASSESSMENT" } },
      create: { studentId: session.profileId, code: "FIRST_ASSESSMENT", title: "First Assessment" },
      update: {},
    });
  }

  return NextResponse.json({
    result: { rawScore, totalMarks, percentage, previousPercentage, improvementPct },
    skillUpdate: { skillBefore: before, skillAfter: after },
    review: answerRows,
    readiness: profile?.readiness ?? null,
    recommendation,
  });
});
