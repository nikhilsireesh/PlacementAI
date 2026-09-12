import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import type { SkillCategory } from "@prisma/client";

export const GET = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") as SkillCategory | null) ?? undefined;
  const skillId = searchParams.get("skillId") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;

  const practiceSets = await prisma.assessment.findMany({
    where: {
      isPractice: true,
      ...(category ? { category } : {}),
      ...(skillId ? { skillId } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    include: { skill: true, _count: { select: { questions: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    practiceSets: practiceSets.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      skill: p.skill.name,
      skillId: p.skillId,
      difficulty: p.difficulty,
      topic: p.topic,
      questionCount: p._count.questions,
    })),
  });
});
