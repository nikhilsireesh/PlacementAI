import { NextResponse } from "next/server";
import { requireSession, withErrorHandling } from "@/lib/apiUtils";
import { getAllStudentReadinessRows } from "@/lib/services/facultyAnalytics";

export const GET = withErrorHandling(async (req: Request) => {
  await requireSession(["FACULTY", "ADMIN"]);
  const { searchParams } = new URL(req.url);

  const departmentId = searchParams.get("departmentId") ?? undefined;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
  const jobRole = searchParams.get("jobRole") ?? undefined;
  const skill = searchParams.get("skill") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const maxReadiness = searchParams.get("maxReadiness") ? Number(searchParams.get("maxReadiness")) : undefined;

  let rows = await getAllStudentReadinessRows();

  if (departmentId) rows = rows.filter((r) => r.departmentId === departmentId);
  if (year) rows = rows.filter((r) => r.year === year);
  if (jobRole) rows = rows.filter((r) => r.targetRole === jobRole);
  if (skill) rows = rows.filter((r) => r.primaryGap === skill);
  if (priority) rows = rows.filter((r) => r.primaryGapPriority === priority);
  if (maxReadiness != null) rows = rows.filter((r) => r.readiness != null && r.readiness <= maxReadiness);

  rows.sort((a, b) => (a.readiness ?? 999) - (b.readiness ?? 999));

  return NextResponse.json({ students: rows, total: rows.length });
});
