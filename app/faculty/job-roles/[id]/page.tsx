import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { WeightEditor } from "./WeightEditor";

export default async function JobRoleConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await prisma.jobRole.findUnique({
    where: { id },
    include: { skills: { include: { skill: true } } },
  });
  if (!role) notFound();

  const allSkills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  const currentSkillIds = new Set(role.skills.map((s) => s.skillId));

  return (
    <div className="space-y-6">
      <Link href="/faculty/job-roles" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" /> Back to Job Roles
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{role.name}</h1>
        <p className="text-[var(--muted)]">{role.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Weights</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Readiness = Σ (skill score × weight). Weights should sum to approximately 100%.
        </p>
        <WeightEditor
          jobRoleId={role.id}
          initialWeights={role.skills.map((s) => ({
            skillId: s.skillId,
            skillName: s.skill.name,
            weight: s.weight,
            minimumTarget: s.minimumTarget,
          }))}
          availableSkills={allSkills
            .filter((s) => !currentSkillIds.has(s.id))
            .map((s) => ({ skillId: s.id, skillName: s.name }))}
        />
      </Card>
    </div>
  );
}
