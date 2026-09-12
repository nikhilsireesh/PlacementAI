import { NextResponse } from "next/server";
import { requireSession, withErrorHandling } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandling(async () => {
  await requireSession(["FACULTY", "ADMIN"]);
  const jobRoles = await prisma.jobRole.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ jobRoles });
});
