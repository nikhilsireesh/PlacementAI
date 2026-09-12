import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { getStudentProgress } from "@/lib/services/progressService";

export const GET = withErrorHandling(async () => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const progress = await getStudentProgress(session.profileId);
  return NextResponse.json(progress);
});
