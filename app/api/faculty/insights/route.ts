import { NextResponse } from "next/server";
import { requireSession, withErrorHandling } from "@/lib/apiUtils";
import { getFacultyOverview } from "@/lib/services/facultyAnalytics";
import { generateFacultyInsight } from "@/lib/ai/aiService";

export const GET = withErrorHandling(async (req: Request) => {
  await requireSession(["FACULTY", "ADMIN"]);
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department") ?? undefined;

  const overview = await getFacultyOverview();

  const { source, data } = await generateFacultyInsight({
    totalStudents: overview.totalStudents,
    averageReadiness: overview.averageReadiness,
    skillGapDistribution: overview.skillGapDistribution,
    department,
  });

  return NextResponse.json({ source, insight: data, overview });
});
