import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function JobRolesPage() {
  const jobRoles = await prisma.jobRole.findMany({
    include: { skills: { include: { skill: true } }, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Job Roles</h1>
        <p className="text-[var(--muted)]">
          Configure how much each skill counts toward the readiness score for each role.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {jobRoles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle>{role.name}</CardTitle>
              <Badge tone="neutral">{role._count.students} students</Badge>
            </CardHeader>
            <p className="mb-3 text-sm text-[var(--muted)]">{role.description}</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {role.skills.map((s) => (
                <Badge key={s.id} tone="secondary">
                  {s.skill.name} · {Math.round(s.weight * 100)}%
                </Badge>
              ))}
            </div>
            <Link href={`/faculty/job-roles/${role.id}`} className="flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
              Configure weights <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
