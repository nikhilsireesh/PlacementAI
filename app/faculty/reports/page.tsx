import { getFacultyOverview } from "@/lib/services/facultyAnalytics";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Progress";
import { formatDateTime } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

export default async function ReportsPage() {
  const overview = await getFacultyOverview();
  const highRisk = overview.skillGapDistribution.filter((s) => s.belowTargetPercent >= 40);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Placement Readiness Report</h1>
          <p className="text-[var(--muted)]">Generated {formatDateTime(new Date())}</p>
        </div>
        <PrintButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{overview.totalStudents}</p>
            <p className="text-xs text-[var(--muted)]">Total Students</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{overview.averageReadiness}</p>
            <p className="text-xs text-[var(--muted)]">Average Readiness</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--success)]">{overview.placementReadyCount}</p>
            <p className="text-xs text-[var(--muted)]">Placement Ready</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--danger)]">{overview.needsSupportCount}</p>
            <p className="text-xs text-[var(--muted)]">Needs Support</p>
          </div>
        </div>
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
                <span className="text-[var(--muted)]">{d.averageReadiness} avg · {d.studentCount} students</span>
              </div>
              <ProgressBar value={d.averageReadiness} />
            </div>
          ))}
        </div>
      </Card>

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
                value={s.belowTargetPercent}
                colorClassName={s.belowTargetPercent >= 40 ? "bg-[var(--danger)]" : s.belowTargetPercent >= 20 ? "bg-[var(--warning)]" : "bg-[var(--success)]"}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>High-Risk Areas</CardTitle>
        </CardHeader>
        {highRisk.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No skill currently has 40%+ of students below target.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm text-[var(--foreground)]">
            {highRisk.map((s) => (
              <li key={s.skill}>
                {s.skill}: {s.belowTargetPercent}% of students are below their role&apos;s target threshold.
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
