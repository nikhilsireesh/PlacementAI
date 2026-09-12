import { NextResponse } from "next/server";
import { requireSession, withErrorHandling } from "@/lib/apiUtils";
import { getFacultyOverview } from "@/lib/services/facultyAnalytics";

export const GET = withErrorHandling(async () => {
  await requireSession(["FACULTY", "ADMIN"]);
  const overview = await getFacultyOverview();
  return NextResponse.json(overview);
});
