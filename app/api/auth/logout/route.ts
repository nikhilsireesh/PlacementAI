import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { withErrorHandling } from "@/lib/apiUtils";

export const POST = withErrorHandling(async () => {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
});
