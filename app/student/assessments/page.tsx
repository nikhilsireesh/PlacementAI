import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, ListChecks, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function AssessmentsPage() {
  const session = await getSession();
  if (!session?.profileId) redirect("/login");

  const [assessments, attempts] = await Promise.all([
    prisma.assessment.findMany({
      where: { isPractice: false },
      include: { skill: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.assessmentAttempt.findMany({
      where: { studentId: session.profileId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const lastAttempt = new Map<string, number>();
  for (const a of attempts) {
    if (!lastAttempt.has(a.assessmentId) && a.percentage != null) lastAttempt.set(a.assessmentId, a.percentage);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Assessments</h1>
        <p className="text-[var(--muted)]">
          Formal, timed assessments that update your skill scores and readiness.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {assessments.map((a) => {
          const last = lastAttempt.get(a.id);
          return (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle>{a.title}</CardTitle>
                <Badge tone="secondary">{a.skill.name}</Badge>
              </CardHeader>
              <div className="mb-4 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <ListChecks className="h-4 w-4" /> {a._count.questions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {a.timeLimitMinutes} min
                </span>
                {last != null && <span>Last score: {last}%</span>}
              </div>
              <Link href={`/student/assessments/${a.id}`}>
                <Button className="w-full" variant={last != null ? "outline" : "primary"}>
                  {last != null ? "Retake" : "Start Assessment"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
