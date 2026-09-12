import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import { computeStudentProfile } from "@/lib/services/skillEngine";
import { readinessLevel, READINESS_LEVEL_LABEL } from "@/lib/engine/readiness";

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireSession(["FACULTY", "ADMIN"]);
    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true, department: true, preferredRole: true, badges: true },
    });
    if (!student) throw new ApiError(404, "Student not found.");

    const profile = student.preferredRoleId ? await computeStudentProfile(id) : null;

    const [attempts, recommendations, interviews] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where: { studentId: id, submittedAt: { not: null } },
        include: { assessment: { include: { skill: true } } },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      prisma.recommendation.findMany({
        where: { studentId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.interviewSession.findMany({
        where: { studentId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        rollNumber: student.rollNumber,
        department: student.department.name,
        year: student.year,
        semester: student.semester,
        cgpa: student.cgpa,
        targetRole: student.preferredRole?.name ?? null,
        profileCompletion: student.profileCompletion,
        badges: student.badges,
      },
      readiness: profile
        ? {
            score: profile.readiness.score,
            level: READINESS_LEVEL_LABEL[readinessLevel(profile.readiness.score)],
            confidence: profile.readiness.confidence,
            breakdown: profile.readiness.breakdown,
          }
        : null,
      gaps: profile?.gaps ?? [],
      assessmentHistory: attempts.map((a) => ({
        title: a.assessment.title,
        skill: a.assessment.skill.name,
        percentage: a.percentage,
        submittedAt: a.submittedAt,
      })),
      recommendations: recommendations.map((r) => ({
        primaryGap: r.primaryGap,
        nextBestAction: r.nextBestAction,
        priority: r.priority,
        status: r.status,
        source: r.source,
        createdAt: r.createdAt,
        feedbackRating: r.feedbackRating,
      })),
      interviewSessions: interviews.map((i) => ({
        type: i.type,
        aiScore: i.aiScore,
        createdAt: i.createdAt,
      })),
    });
  }
);
