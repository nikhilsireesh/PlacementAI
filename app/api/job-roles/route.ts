import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/apiUtils";

export const GET = withErrorHandling(async () => {
  const jobRoles = await prisma.jobRole.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { skills: { include: { skill: true } } },
  });
  return NextResponse.json({
    jobRoles: jobRoles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      skills: r.skills.map((s) => ({
        skillId: s.skillId,
        name: s.skill.name,
        category: s.skill.category,
        weight: s.weight,
        minimumTarget: s.minimumTarget,
      })),
    })),
  });
});
