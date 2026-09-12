import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";

export default async function FacultyResourcesPage() {
  const resources = await prisma.learningResource.findMany({
    include: { skill: true },
    orderBy: { skill: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Learning Resources</h1>
        <p className="text-[var(--muted)]">
          The resource library shown to students. Seeded with free resources for this MVP.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-sm">{r.title}</CardTitle>
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="secondary">{r.skill.name}</Badge>
              <Badge tone="neutral">{r.resourceType}</Badge>
            </div>
            <p className="mb-3 text-sm text-[var(--muted)]">{r.description}</p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
              Open <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
