"use client";

import { useState } from "react";
import { Sparkles, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { apiPost, ClientApiError } from "@/lib/apiClient";

interface RoadmapDay {
  day: number;
  focus: string;
  tasks: string[];
  estimated_minutes: number;
}

export default function RoadmapPage() {
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<{ targetRole: string; source: "AI" | "FALLBACK"; days: RoadmapDay[] } | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost<{ targetRole: string; source: "AI" | "FALLBACK"; roadmap: { days: RoadmapDay[] } }>(
        "/api/roadmap/generate",
        { days }
      );
      setRoadmap({ targetRole: res.targetRole, source: res.source, days: res.roadmap.days });
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to generate a roadmap.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Personalized Roadmap</h1>
          <p className="text-[var(--muted)]">A day-by-day plan built from your current skill gaps.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={21}>21 days</option>
          </select>
          <Button onClick={generate} disabled={loading}>
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating…" : roadmap ? "Regenerate" : "Generate Roadmap"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {loading && <LoadingState label="Building your roadmap…" />}

      {!roadmap && !loading && (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="No roadmap yet"
            description="Generate a roadmap to get a day-by-day preparation plan tailored to your current gaps."
            action={<Button onClick={generate}>Generate Roadmap</Button>}
          />
        </Card>
      )}

      {roadmap && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="secondary">{roadmap.targetRole}</Badge>
            {roadmap.source === "FALLBACK" && <Badge tone="neutral">Rule-based plan</Badge>}
          </div>
          <div className="relative space-y-4 border-l-2 border-[var(--border)] pl-6">
            {roadmap.days.map((d) => (
              <div key={d.day} className="relative">
                <div className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                  {d.day}
                </div>
                <Card>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--foreground)]">{d.focus}</h3>
                    <span className="text-xs text-[var(--muted)]">{d.estimated_minutes} min</span>
                  </div>
                  <ul className="list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
                    {d.tasks.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
