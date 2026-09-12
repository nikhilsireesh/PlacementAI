import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, requireSession } from "@/lib/apiUtils";

export const GET = withErrorHandling(async (req: Request) => {
  await requireSession();
  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;

  const resources = await prisma.learningResource.findMany({
    where: {
      ...(skillId ? { skillId } : {}),
      ...(difficulty ? { difficulty } : {}),
    },
    include: { skill: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ resources });
});
