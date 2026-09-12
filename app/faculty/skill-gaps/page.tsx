import Link from "next/link";
import { getFacultyOverview } from "@/lib/services/facultyAnalytics";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";

export default async function SkillGapsPage() {
  const overview = await getFacultyOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Skill Gap Analysis</h1>
        <p className="text-[var(--muted)]">
          Percentage of students below the target threshold for each skill, across their own selected roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribution</CardTitle>
        </CardHeader>
        <div className="space-y-5">
          {overview.skillGapDistribution.map((s) => (
            <div key={s.skill}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-medium text-[var(--foreground)]">{s.skill}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted)]">{s.belowTargetPercent}% below target</span>
                  <Link href={`/faculty/students?skill=${encodeURIComponent(s.skill)}`}>
                    <Button size="sm" variant="outline">
                      View students
                    </Button>
                  </Link>
                </div>
              </div>
              <ProgressBar
                value={s.belowTargetPercent}
                colorClassName={
                  s.belowTargetPercent >= 40
                    ? "bg-[var(--danger)]"
                    : s.belowTargetPercent >= 20
                      ? "bg-[var(--warning)]"
                      : "bg-[var(--success)]"
                }
              />
            </div>
          ))}
          {overview.skillGapDistribution.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No students have selected a target role yet, so skill-gap data isn&apos;t available.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
