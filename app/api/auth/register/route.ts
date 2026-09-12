import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { withErrorHandling, ApiError } from "@/lib/apiUtils";

// Public registration is intentionally limited to students. Faculty/Admin
// accounts are provisioned by the seed script / an existing admin — this
// keeps the demo's role boundaries simple and avoids an open faculty signup.
const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  rollNumber: z.string().min(1).max(30),
  departmentId: z.string().min(1),
  year: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(12),
});

export const POST = withErrorHandling(async (req: Request) => {
  const body = registerSchema.parse(await req.json());
  const email = body.email.toLowerCase().trim();

  const [existingUser, existingRoll, department] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.student.findUnique({ where: { rollNumber: body.rollNumber } }),
    prisma.department.findUnique({ where: { id: body.departmentId } }),
  ]);

  if (existingUser) throw new ApiError(409, "An account with this email already exists.");
  if (existingRoll) throw new ApiError(409, "This roll number is already registered.");
  if (!department) throw new ApiError(400, "Invalid department selected.");

  const passwordHash = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email,
      passwordHash,
      role: "STUDENT",
      student: {
        create: {
          rollNumber: body.rollNumber,
          departmentId: body.departmentId,
          year: body.year,
          semester: body.semester,
          profileCompletion: 40,
        },
      },
    },
    include: { student: true },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    profileId: user.student?.id,
  });

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    { status: 201 }
  );
});
