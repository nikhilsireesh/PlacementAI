import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";

export const GET = withErrorHandling(async () => {
  const session = await requireSession(["STUDENT"]);

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { user: true, department: true, preferredRole: true },
  });
  if (!student) throw new ApiError(404, "Student profile not found.");

  return NextResponse.json({
    student: {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
      semester: student.semester,
      cgpa: student.cgpa,
      preferredRole: student.preferredRole,
      profileCompletion: student.profileCompletion,
    },
  });
});

const updateSchema = z.object({
  preferredRoleId: z.string().optional(),
  departmentId: z.string().optional(),
  year: z.number().int().min(1).max(6).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

function computeProfileCompletion(fields: {
  preferredRoleId: string | null;
  cgpa: number | null;
  departmentId: string | null;
  year: number | null;
}): number {
  let score = 40; // base for having registered
  if (fields.departmentId) score += 15;
  if (fields.year) score += 15;
  if (fields.cgpa != null) score += 15;
  if (fields.preferredRoleId) score += 15;
  return Math.min(100, score);
}

export const PATCH = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  const body = updateSchema.parse(await req.json());

  const student = await prisma.student.findUnique({ where: { userId: session.userId } });
  if (!student) throw new ApiError(404, "Student profile not found.");

  const merged = {
    preferredRoleId: body.preferredRoleId ?? student.preferredRoleId,
    departmentId: body.departmentId ?? student.departmentId,
    year: body.year ?? student.year,
    cgpa: body.cgpa ?? student.cgpa,
  };

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      ...body,
      profileCompletion: computeProfileCompletion(merged),
    },
    include: { department: true, preferredRole: true },
  });

  return NextResponse.json({ student: updated });
});
