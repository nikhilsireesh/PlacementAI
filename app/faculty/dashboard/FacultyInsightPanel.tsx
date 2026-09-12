"use client";

import { useState } from "react";
import { Sparkles, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, ClientApiError } from "@/lib/apiClient";

interface InsightResponse {
  source: "AI" | "FALLBACK";
  insight: { summary: string; suggested_intervention: string };
}

export function FacultyInsightPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InsightResponse | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<InsightResponse>("/api/faculty/insights");
      setData(res);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to generate an insight.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[var(--warning)]" /> Faculty Insight
        </CardTitle>
        <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Generating…" : "Generate Insight"}
        </Button>
      </CardHeader>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {!data && !error && (
        <p className="text-sm text-[var(--muted)]">
          Generate a plain-language summary of current placement readiness data, with a suggested
          intervention — computed only from real aggregated statistics.
        </p>
      )}
      {data && (
        <div className="space-y-3">
          {data.source === "FALLBACK" && <Badge tone="neutral">Rule-based summary</Badge>}
          <p className="text-sm text-[var(--foreground)]">{data.insight.summary}</p>
          <p className="rounded-lg bg-[var(--primary-soft)] p-3 text-sm font-medium text-[var(--primary)]">
            Suggested intervention: {data.insight.suggested_intervention}
          </p>
        </div>
      )}
    </Card>
  );
}
