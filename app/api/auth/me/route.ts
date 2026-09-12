import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiUtils";

export const GET = withErrorHandling(async () => {
  const session = await getSession();
  return NextResponse.json({ user: session });
});
