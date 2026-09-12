import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "prs_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function readRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isStudentArea = pathname.startsWith("/student");
  const isFacultyArea = pathname.startsWith("/faculty");

  if (!isStudentArea && !isFacultyArea) {
    return NextResponse.next();
  }

  const role = await readRole(req);

  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isStudentArea && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/faculty/dashboard", req.url));
  }

  if (isFacultyArea && role !== "FACULTY" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/faculty/:path*"],
};
