import { NextResponse } from "next/server";
import { requireSession, withErrorHandling } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandling(async () => {
  await requireSession();
  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ skills });
});
