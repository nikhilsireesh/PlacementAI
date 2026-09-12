import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import { gradeAnswers } from "@/lib/services/grading";
import { applySkillUpdate, computeStudentProfile, recordReadinessSnapshot } from "@/lib/services/skillEngine";
import { generateAndStoreRecommendation } from "@/lib/services/recommendationService";

// Practice sessions use the same question bank as assessments but are
// lightweight, un-timed, and don't require a formal "start" step — a
// student picks a skill, answers a short set, and gets instant feedback.
const bodySchema = z.object({
  assessmentId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), answerText: z.string().max(2000) })),
  timeSpentSeconds: z.number().int().min(0).max(3600).default(0),
  recommendationId: z.string().optional(),
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");
  const body = bodySchema.parse(await req.json());

  const assessment = await prisma.assessment.findUnique({
    where: { id: body.assessmentId },
    include: { questions: true },
  });
  if (!assessment) throw new ApiError(404, "Practice set not found.");

  const { rawScore, totalMarks, percentage, answers } = gradeAnswers(
    assessment.questions,
    body.answers
  );
  const questionsCorrect = answers.filter((a) => a.isCorrect).length;

  const session_ = await prisma.practiceSession.create({
    data: {
      studentId: session.profileId,
      skillId: assessment.skillId,
      category: assessment.category,
      questionsAttempted: answers.length,
      questionsCorrect,
      timeSpentSeconds: body.timeSpentSeconds,
      score: percentage,
      recommendationId: body.recommendationId,
    },
  });

  const { before, after } = await applySkillUpdate(
    session.profileId,
    assessment.skillId,
    percentage,
    "practice"
  );

  const profile = await computeStudentProfile(session.profileId);
  if (profile) await recordReadinessSnapshot(session.profileId, profile.readiness);
  const recommendation = await generateAndStoreRecommendation(session.profileId);

  const practiceCount = await prisma.practiceSession.count({ where: { studentId: session.profileId } });
  if (practiceCount === 1) {
    await prisma.studentBadge.upsert({
      where: { studentId_code: { studentId: session.profileId, code: "FIRST_PRACTICE" } },
      create: { studentId: session.profileId, code: "FIRST_PRACTICE", title: "First Practice Session" },
      update: {},
    });
  }
  const totalCorrectEver = await prisma.practiceSession.aggregate({
    where: { studentId: session.profileId },
    _sum: { questionsCorrect: true },
  });
  if ((totalCorrectEver._sum.questionsCorrect ?? 0) >= 10) {
    await prisma.studentBadge.upsert({
      where: { studentId_code: { studentId: session.profileId, code: "TEN_PROBLEMS" } },
      create: { studentId: session.profileId, code: "TEN_PROBLEMS", title: "10 Problems Solved" },
      update: {},
    });
  }

  return NextResponse.json({
    practiceSessionId: session_.id,
    result: { rawScore, totalMarks, percentage, questionsCorrect, questionsAttempted: answers.length },
    review: answers,
    skillUpdate: { skillBefore: before, skillAfter: after },
    readiness: profile?.readiness ?? null,
    recommendation,
  });
});
