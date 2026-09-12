import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  ARTICLE: "Article",
  VIDEO: "Video",
  PRACTICE_SET: "Practice Set",
  DOCUMENTATION: "Documentation",
  COURSE: "Course",
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const session = await getSession();
  if (!session?.profileId) redirect("/login");
  const { skill: skillFilter } = await searchParams;

  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  const matchedSkill = skillFilter ? skills.find((s) => s.name === skillFilter) : undefined;

  const resources = await prisma.learningResource.findMany({
    where: matchedSkill ? { skillId: matchedSkill.id } : undefined,
    include: { skill: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Learning Resources</h1>
        <p className="text-[var(--muted)]">Free, curated resources to help close your skill gaps.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/student/resources">
          <Badge tone={!matchedSkill ? "primary" : "neutral"}>All</Badge>
        </Link>
        {skills.map((s) => (
          <Link key={s.id} href={`/student/resources?skill=${encodeURIComponent(s.name)}`}>
            <Badge tone={matchedSkill?.id === s.id ? "primary" : "neutral"}>{s.name}</Badge>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-sm">{r.title}</CardTitle>
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="secondary">{r.skill.name}</Badge>
              <Badge tone="neutral">{RESOURCE_TYPE_LABEL[r.resourceType]}</Badge>
              <Badge tone="neutral">{r.difficulty}</Badge>
            </div>
            <p className="mb-3 text-sm text-[var(--muted)]">{r.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-[var(--muted)]">
                <Clock className="h-4 w-4" /> {r.estimatedMinutes} min
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-[var(--primary)]"
              >
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
