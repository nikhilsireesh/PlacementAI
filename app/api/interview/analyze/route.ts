import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import { analyzeInterview } from "@/lib/ai/aiService";
import { applySkillUpdate, computeStudentProfile, recordReadinessSnapshot } from "@/lib/services/skillEngine";
import { generateAndStoreRecommendation } from "@/lib/services/recommendationService";

const bodySchema = z.object({
  jobRoleId: z.string().min(1),
  type: z.enum(["HR", "TECHNICAL", "BEHAVIORAL"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(4000),
});

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");
  const body = bodySchema.parse(await req.json());

  const jobRole = await prisma.jobRole.findUnique({ where: { id: body.jobRoleId } });
  if (!jobRole) throw new ApiError(404, "Job role not found.");

  const { source, data } = await analyzeInterview(body.question, body.answer, jobRole.name, body.type);

  const session_ = await prisma.interviewSession.create({
    data: {
      studentId: session.profileId,
      jobRoleId: body.jobRoleId,
      type: body.type,
      difficulty: body.difficulty,
      questions: [body.question] as unknown as object,
      answers: [body.answer] as unknown as object,
      aiScore: data.score,
      strengths: data.strengths as unknown as object,
      improvements: data.areas_to_improve as unknown as object,
      nextAction: data.next_action,
      source,
    },
  });

  // Feed the score into the "Interview" skill so readiness reflects practice.
  const interviewSkill = await prisma.skill.findFirst({ where: { category: "INTERVIEW" } });
  let skillUpdate: { skillBefore: number; skillAfter: number } | null = null;
  if (interviewSkill) {
    const { before, after } = await applySkillUpdate(
      session.profileId,
      interviewSkill.id,
      data.score,
      "practice"
    );
    skillUpdate = { skillBefore: before, skillAfter: after };
  }

  const profile = await computeStudentProfile(session.profileId);
  if (profile) await recordReadinessSnapshot(session.profileId, profile.readiness);
  const recommendation = await generateAndStoreRecommendation(session.profileId);

  return NextResponse.json({
    interviewSessionId: session_.id,
    source,
    analysis: data,
    skillUpdate,
    recommendation,
  });
});
