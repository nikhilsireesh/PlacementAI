import Link from "next/link";
import { redirect } from "next/navigation";
import { ListChecks, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const session = await getSession();
  if (!session?.profileId) redirect("/login");
  const { skill: skillFilter } = await searchParams;

  const skills = await prisma.skill.findMany();
  const matchedSkill = skillFilter ? skills.find((s) => s.name === skillFilter) : undefined;

  const practiceSets = await prisma.assessment.findMany({
    where: { isPractice: true, ...(matchedSkill ? { skillId: matchedSkill.id } : {}) },
    include: { skill: true, _count: { select: { questions: true } } },
    orderBy: { createdAt: "asc" },
  });

  const allPracticeSets =
    practiceSets.length === 0 && matchedSkill
      ? await prisma.assessment.findMany({
          where: { isPractice: true },
          include: { skill: true, _count: { select: { questions: true } } },
          orderBy: { createdAt: "asc" },
        })
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Practice</h1>
        <p className="text-[var(--muted)]">
          Short, untimed practice sets to close specific skill gaps.
          {matchedSkill && <> Showing sets for <strong>{matchedSkill.name}</strong>.</>}
        </p>
        {matchedSkill && (
          <Link href="/student/practice" className="text-sm text-[var(--primary)]">
            Clear filter
          </Link>
        )}
      </div>

      {practiceSets.length === 0 && matchedSkill ? (
        <Card>
          <EmptyState
            title={`No dedicated practice set yet for ${matchedSkill.name}`}
            description="Try a related resource instead, or browse all available practice sets below."
            action={
              <Link href={`/student/resources?skill=${encodeURIComponent(matchedSkill.name)}`}>
                <Button variant="outline">Browse {matchedSkill.name} resources</Button>
              </Link>
            }
          />
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(practiceSets.length > 0 ? practiceSets : allPracticeSets).map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
              <Badge tone="secondary">{p.skill.name}</Badge>
            </CardHeader>
            <p className="mb-4 flex items-center gap-1 text-sm text-[var(--muted)]">
              <ListChecks className="h-4 w-4" /> {p._count.questions} questions · {p.difficulty}
            </p>
            <Link href={`/student/practice/${p.id}`}>
              <Button className="w-full">
                Start Practice <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
