import Link from "next/link";
import { Users, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { getFacultyOverview } from "@/lib/services/facultyAnalytics";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Progress";
import { FacultyInsightPanel } from "./FacultyInsightPanel";

export default async function FacultyDashboardPage() {
  const overview = await getFacultyOverview();
  const maxGapPercent = Math.max(...overview.skillGapDistribution.map((s) => s.belowTargetPercent), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Placement Readiness Overview</h1>
        <p className="text-[var(--muted)]">Live, computed from student assessment and skill data.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
            <Users className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{overview.totalStudents}</p>
            <p className="text-xs text-[var(--muted)]">Total Students</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary-soft)]">
            <TrendingUp className="h-5 w-5 text-[var(--secondary)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{overview.averageReadiness}</p>
            <p className="text-xs text-[var(--muted)]">Average Readiness</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-soft)]">
            <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{overview.placementReadyCount}</p>
            <p className="text-xs text-[var(--muted)]">Placement Ready (≥75)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger-soft)]">
            <AlertTriangle className="h-5 w-5 text-[var(--danger)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--foreground)]">{overview.needsSupportCount}</p>
            <p className="text-xs text-[var(--muted)]">Needs Support (&lt;60)</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Gap Distribution</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {overview.skillGapDistribution.map((s) => (
              <div key={s.skill}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">{s.skill}</span>
                  <span className="text-[var(--muted)]">{s.belowTargetPercent}% below target</span>
                </div>
                <ProgressBar
                  value={(s.belowTargetPercent / maxGapPercent) * 100}
                  colorClassName={s.belowTargetPercent >= 40 ? "bg-[var(--danger)]" : s.belowTargetPercent >= 20 ? "bg-[var(--warning)]" : "bg-[var(--success)]"}
                />
              </div>
            ))}
          </div>
          <Link href="/faculty/skill-gaps" className="mt-4 inline-block text-sm font-medium text-[var(--primary)]">
            View full skill-gap analysis →
          </Link>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {overview.departmentBreakdown.map((d) => (
              <div key={d.department}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">{d.department}</span>
                  <span className="text-[var(--muted)]">
                    {d.averageReadiness} avg · {d.studentCount} students
                  </span>
                </div>
                <ProgressBar value={d.averageReadiness} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <FacultyInsightPanel />
    </div>
  );
}
