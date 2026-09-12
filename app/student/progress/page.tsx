import { redirect } from "next/navigation";
import { Flame, Award, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getStudentProgress } from "@/lib/services/progressService";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ReadinessLineChart } from "@/components/charts/ReadinessLineChart";
import { EmptyState } from "@/components/ui/States";
import { formatDate } from "@/lib/utils";

export default async function ProgressPage() {
  const session = await getSession();
  if (!session?.profileId) redirect("/login");

  const progress = await getStudentProgress(session.profileId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Your Progress</h1>
        <p className="text-[var(--muted)]">Real data from your assessments, practice, and recommendations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-soft)]">
            <Flame className="h-5 w-5 text-[var(--warning)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{progress.practiceStreak} days</p>
            <p className="text-xs text-[var(--muted)]">Preparation streak</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-soft)]">
            <TrendingUp className="h-5 w-5 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{progress.recommendationStats.completionRate}%</p>
            <p className="text-xs text-[var(--muted)]">
              Recommendation completion ({progress.recommendationStats.completed}/{progress.recommendationStats.total})
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
            <Award className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{progress.totalPracticeSessions}</p>
            <p className="text-xs text-[var(--muted)]">Practice sessions completed</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Readiness Over Time</CardTitle>
        </CardHeader>
        {progress.readinessHistory.length > 1 ? (
          <ReadinessLineChart data={progress.readinessHistory} />
        ) : (
          <EmptyState
            title="Not enough history yet"
            description="Keep visiting your dashboard and completing activities — your readiness trend will appear here."
          />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Progress</CardTitle>
          </CardHeader>
          {progress.skillProgress.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No skill history yet.</p>
          ) : (
            <div className="space-y-4">
              {progress.skillProgress.map((s) => {
                const first = s.points[0]?.score;
                const last = s.points[s.points.length - 1]?.score;
                const delta = last != null && first != null ? Math.round((last - first) * 10) / 10 : null;
                return (
                  <div key={s.skillName} className="flex items-center justify-between border-b border-[var(--border)] pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{s.skillName}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {s.points.map((p) => Math.round(p.score)).join(" → ")}
                      </p>
                    </div>
                    {delta != null && (
                      <span className={`text-sm font-semibold ${delta >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {delta >= 0 ? "+" : ""}
                        {delta} pts
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment History</CardTitle>
          </CardHeader>
          {progress.assessmentHistory.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No assessments submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {progress.assessmentHistory.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{a.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {a.submittedAt && formatDate(a.submittedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--foreground)]">{a.percentage}%</p>
                    {a.improvementPct != null && (
                      <p className={`text-xs ${a.improvementPct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {a.improvementPct >= 0 ? "+" : ""}
                        {a.improvementPct} pts
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
