import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { withErrorHandling, ApiError } from "@/lib/apiUtils";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = withErrorHandling(async (req: Request) => {
  const body = loginSchema.parse(await req.json());

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase().trim() },
    include: { student: true, faculty: true },
  });

  if (!user) throw new ApiError(401, "Invalid email or password.");

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password.");

  const profileId = user.student?.id ?? user.faculty?.id;

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    profileId,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});
