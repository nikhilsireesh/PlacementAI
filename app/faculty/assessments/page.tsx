import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function FacultyAssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    include: { skill: true, _count: { select: { questions: true, attempts: true } } },
    orderBy: [{ isPractice: "asc" }, { createdAt: "asc" }],
  });

  const formal = assessments.filter((a) => !a.isPractice);
  const practice = assessments.filter((a) => a.isPractice);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Assessments</h1>
          <p className="text-[var(--muted)]">
            The question bank powering student assessments and practice sets.
          </p>
        </div>
        <Link href="/faculty/assessments/new">
          <Button>
            <UploadCloud className="h-4 w-4" /> Upload Questions (PDF)
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formal Assessments</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Skill</th>
                <th className="px-3 py-2">Questions</th>
                <th className="px-3 py-2">Attempts</th>
                <th className="px-3 py-2">Time Limit</th>
              </tr>
            </thead>
            <tbody>
              {formal.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 font-medium text-[var(--foreground)]">{a.title}</td>
                  <td className="px-3 py-2"><Badge tone="secondary">{a.skill.name}</Badge></td>
                  <td className="px-3 py-2 text-[var(--muted)]">{a._count.questions}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{a._count.attempts}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{a.timeLimitMinutes} min</td>
                </tr>
              ))}
              {formal.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[var(--muted)]">
                    No formal assessments yet — upload a question PDF to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Sets</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Skill</th>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Questions</th>
              </tr>
            </thead>
            <tbody>
              {practice.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 font-medium text-[var(--foreground)]">{a.title}</td>
                  <td className="px-3 py-2"><Badge tone="secondary">{a.skill.name}</Badge></td>
                  <td className="px-3 py-2 text-[var(--muted)]">{a.topic ?? "—"}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{a._count.questions}</td>
                </tr>
              ))}
              {practice.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-[var(--muted)]">
                    No practice sets yet — upload a question PDF and mark it as a practice set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
