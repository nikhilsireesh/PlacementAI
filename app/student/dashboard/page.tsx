import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Flame, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStudentProfile, recordReadinessSnapshotIfStale } from "@/lib/services/skillEngine";
import { generateAndStoreRecommendation, getLatestRecommendation } from "@/lib/services/recommendationService";
import { readinessLevel, READINESS_LEVEL_LABEL } from "@/lib/engine/readiness";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, toneForPriority } from "@/components/ui/Badge";
import { ReadinessGauge } from "@/components/dashboard/ReadinessGauge";
import { SkillBars } from "@/components/dashboard/SkillBars";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { toRecommendationDto } from "@/lib/mappers/recommendation";
import { Button } from "@/components/ui/Button";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session?.profileId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { id: session.profileId },
    include: { preferredRole: true, badges: true },
  });
  if (!student) redirect("/login");

  const profile = student.preferredRoleId ? await computeStudentProfile(student.id) : null;

  let recommendation = profile ? await getLatestRecommendation(student.id) : null;
  if (profile && !recommendation) {
    recommendation = await generateAndStoreRecommendation(student.id);
  }
  if (profile) {
    // Keep a lightweight history point on each dashboard visit so a brand
    // new student still sees a chart forming on the Progress page.
    await recordReadinessSnapshotIfStale(student.id, profile.readiness);
  }

  const level = profile ? readinessLevel(profile.readiness.score) : null;
  const firstName = session.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const recentActivity = await prisma.progressRecord.findMany({
    where: { studentId: student.id },
    include: { skill: true },
    orderBy: { recordedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-[var(--muted)]">
          {student.preferredRole
            ? `Target role: ${student.preferredRole.name}`
            : "Select a target job role on your profile to unlock your readiness score."}
        </p>
      </div>

      {!student.preferredRoleId ? (
        <Card className="border-2 border-dashed border-[var(--border)] text-center">
          <p className="font-medium text-[var(--foreground)]">Complete your profile to get started</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose a target job role so we can calculate your placement readiness and next best action.
          </p>
          <Link href="/student/profile">
            <Button className="mt-4">Go to Profile</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center lg:col-span-1">
              <CardHeader className="w-full justify-center">
                <CardTitle>Readiness Score</CardTitle>
              </CardHeader>
              <ReadinessGauge
                score={profile!.readiness.score}
                level={level!}
                levelLabel={READINESS_LEVEL_LABEL[level!]}
              />
              <p className="mt-3 text-center text-xs text-[var(--muted)]">
                Confidence: {profile!.readiness.confidence}%
                {profile!.readiness.confidence < 50 && (
                  <> — complete more assessments for a more reliable score.</>
                )}
              </p>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Skill Overview</CardTitle>
                <span className="text-xs text-[var(--muted)]">vs. {student.preferredRole?.name} targets</span>
              </CardHeader>
              <SkillBars
                skills={profile!.readiness.breakdown.map((b) => ({
                  skillName: b.skillName,
                  score: b.score,
                  target: b.target,
                }))}
              />
            </Card>
          </div>

          <NextBestActionCard recommendation={recommendation ? toRecommendationDto(recommendation) : null} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No activity yet — complete an assessment or practice set to see your history here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {recentActivity.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[var(--foreground)]">
                        <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                        {r.skill ? r.skill.name : "Overall Readiness"} ({r.source})
                      </span>
                      <span className="font-medium text-[var(--foreground)]">{Math.round(r.score)}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              {student.badges.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Complete assessments and practice sessions to earn your first badge.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {student.badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 rounded-xl bg-[var(--warning-soft)] px-3 py-2 text-sm font-medium text-[var(--warning)]"
                    >
                      <Award className="h-4 w-4" /> {b.title}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {profile!.gaps.some((g) => g.priority === "HIGH") && (
            <Card className="border border-[var(--danger)]/20 bg-[var(--danger-soft)]/40">
              <div className="flex items-start gap-3">
                <Flame className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />
                <div>
                  <p className="font-medium text-[var(--foreground)]">High-priority skill gaps</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile!.gaps
                      .filter((g) => g.priority === "HIGH")
                      .map((g) => (
                        <Badge key={g.skillId} tone={toneForPriority(g.priority)}>
                          {g.skillName} · {g.gap} pt gap
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
