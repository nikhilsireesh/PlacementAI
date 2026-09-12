import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { computeStudentProfile } from "@/lib/services/skillEngine";
import { readinessLevel, READINESS_LEVEL_LABEL } from "@/lib/engine/readiness";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, toneForPriority } from "@/components/ui/Badge";
import { ReadinessGauge } from "@/components/dashboard/ReadinessGauge";
import { SkillBars } from "@/components/dashboard/SkillBars";
import { formatDate } from "@/lib/utils";

export default async function FacultyStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true, department: true, preferredRole: true, badges: true },
  });
  if (!student) notFound();

  const profile = student.preferredRoleId ? await computeStudentProfile(id) : null;
  const level = profile ? readinessLevel(profile.readiness.score) : null;

  const [attempts, recommendations] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: { studentId: id, submittedAt: { not: null } },
      include: { assessment: { include: { skill: true } } },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
    prisma.recommendation.findMany({ where: { studentId: id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/faculty/students" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{student.user.name}</h1>
        <p className="text-[var(--muted)]">
          {student.rollNumber} · {student.department.name} · Year {student.year} ·{" "}
          {student.preferredRole?.name ?? "No target role selected"}
        </p>
      </div>

      {!profile ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            This student has not selected a target job role yet, so a readiness score isn&apos;t available.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center">
            <ReadinessGauge score={profile.readiness.score} level={level!} levelLabel={READINESS_LEVEL_LABEL[level!]} />
            <p className="mt-3 text-xs text-[var(--muted)]">Confidence: {profile.readiness.confidence}%</p>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Skill Breakdown</CardTitle>
            </CardHeader>
            <SkillBars
              skills={profile.readiness.breakdown.map((b) => ({ skillName: b.skillName, score: b.score, target: b.target }))}
            />
          </Card>
        </div>
      )}

      {profile && profile.gaps.some((g) => g.gap > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Skill Gaps</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {profile.gaps
              .filter((g) => g.gap > 0)
              .map((g) => (
                <Badge key={g.skillId} tone={toneForPriority(g.priority)}>
                  {g.skillName} · {g.gap} pt gap · {g.priority}
                </Badge>
              ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment History</CardTitle>
          </CardHeader>
          {attempts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No assessments submitted yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {attempts.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <span className="text-[var(--foreground)]">{a.assessment.title}</span>
                  <span className="text-[var(--muted)]">
                    {a.percentage}% · {a.submittedAt && formatDate(a.submittedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Recommendations</CardTitle>
          </CardHeader>
          {recommendations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No recommendations generated yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recommendations.map((r, i) => (
                <li key={i} className="border-b border-[var(--border)] pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--foreground)]">{r.primaryGap}</span>
                    <Badge tone={r.status === "COMPLETED" ? "success" : "neutral"}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{r.nextBestAction}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {student.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {student.badges.map((b) => (
              <span key={b.id} className="flex items-center gap-1.5 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-sm text-[var(--warning)]">
                <Award className="h-4 w-4" /> {b.title}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
