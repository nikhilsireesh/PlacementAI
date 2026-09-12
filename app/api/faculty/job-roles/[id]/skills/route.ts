import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireSession(["FACULTY", "ADMIN"]);
    const { id } = await params;
    const rows = await prisma.jobRoleSkill.findMany({
      where: { jobRoleId: id },
      include: { skill: true },
      orderBy: { weight: "desc" },
    });
    return NextResponse.json({
      skills: rows.map((r) => ({
        id: r.id,
        skillId: r.skillId,
        skillName: r.skill.name,
        weight: r.weight,
        minimumTarget: r.minimumTarget,
      })),
    });
  }
);

// Faculty/Admin can retune how much each skill counts toward readiness for a
// given job role. Weights are validated to (approximately) sum to 1 so the
// readiness formula stays meaningful, but are otherwise fully configurable —
// this is intentionally NOT hard-coded in the frontend.
const updateSchema = z.object({
  weights: z
    .array(z.object({ skillId: z.string().min(1), weight: z.number().min(0).max(1), minimumTarget: z.number().min(0).max(100) }))
    .min(1),
});

export const PUT = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await requireSession(["FACULTY", "ADMIN"]);
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const totalWeight = body.weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight < 0.9 || totalWeight > 1.1) {
      throw new ApiError(400, `Skill weights should sum to approximately 1 (currently ${totalWeight.toFixed(2)}).`);
    }

    await prisma.$transaction(
      body.weights.map((w) =>
        prisma.jobRoleSkill.upsert({
          where: { jobRoleId_skillId: { jobRoleId: id, skillId: w.skillId } },
          create: { jobRoleId: id, skillId: w.skillId, weight: w.weight, minimumTarget: w.minimumTarget },
          update: { weight: w.weight, minimumTarget: w.minimumTarget },
        })
      )
    );

    return NextResponse.json({ ok: true });
  }
);
