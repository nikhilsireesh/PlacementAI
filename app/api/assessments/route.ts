import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import type { SkillCategory } from "@prisma/client";

export const GET = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") as SkillCategory | null) ?? undefined;

  const [assessments, myAttempts] = await Promise.all([
    prisma.assessment.findMany({
      where: { isPractice: false, ...(category ? { category } : {}) },
      include: { skill: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assessmentAttempt.findMany({
      where: { studentId: session.profileId, submittedAt: { not: null } },
      select: { assessmentId: true, percentage: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const lastAttemptByAssessment = new Map<string, { percentage: number | null; submittedAt: Date | null }>();
  for (const a of myAttempts) {
    if (!lastAttemptByAssessment.has(a.assessmentId)) {
      lastAttemptByAssessment.set(a.assessmentId, { percentage: a.percentage, submittedAt: a.submittedAt });
    }
  }

  return NextResponse.json({
    assessments: assessments.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      skill: a.skill.name,
      skillId: a.skillId,
      difficulty: a.difficulty,
      timeLimitMinutes: a.timeLimitMinutes,
      questionCount: a._count.questions,
      totalMarks: a.totalMarks,
      lastAttempt: lastAttemptByAssessment.get(a.id) ?? null,
    })),
  });
});
