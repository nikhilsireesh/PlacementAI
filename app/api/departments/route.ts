import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/apiUtils";

export const GET = withErrorHandling(async () => {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ departments });
});
