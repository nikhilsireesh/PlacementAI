import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Ensures a valid session exists, optionally restricted to given roles. */
export async function requireSession(allowedRoles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "You must be signed in.");
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  return session;
}

/** Route context for a dynamic segment, e.g. `{ params: Promise<{ id: string }> }`. */
export type RouteContext = { params: Promise<Record<string, string>> };

/** Wraps a route handler, converting ApiError / Zod / unknown errors into a
 * friendly JSON response and preventing stack traces from ever reaching the client. */
export function withErrorHandling<Ctx = RouteContext>(
  handler: (req: Request, ctx: Ctx) => Promise<NextResponse>
) {
  return async (req: Request, ctx: Ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err && typeof err === "object" && "issues" in err) {
        return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
      }
      console.error("[api]", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  };
}
