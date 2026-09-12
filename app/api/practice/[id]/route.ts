import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireSession(["STUDENT"]);
    const { id } = await params;

    const practiceSet = await prisma.assessment.findUnique({
      where: { id, isPractice: true },
      include: { questions: true, skill: true },
    });
    if (!practiceSet) throw new ApiError(404, "Practice set not found.");

    return NextResponse.json({
      practiceSet: {
        id: practiceSet.id,
        title: practiceSet.title,
        skill: practiceSet.skill.name,
      },
      questions: practiceSet.questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        options: q.options,
        marks: q.marks,
        difficulty: q.difficulty,
        topic: q.topic,
      })),
    });
  }
);
