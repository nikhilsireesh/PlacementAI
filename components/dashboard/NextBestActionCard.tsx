"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Clock, ArrowRight, Sparkles, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, toneForPriority } from "@/components/ui/Badge";
import { apiPost } from "@/lib/apiClient";
import type { RecommendationDto } from "@/lib/mappers/recommendation";

export type { RecommendationDto };

function ctaFor(practiceType: string, primaryGap: string) {
  if (practiceType === "mock_interview") return { label: "Start Mock Interview", href: "/student/interview" };
  if (practiceType === "resume_review") return { label: "Review Resume", href: "/student/resume" };
  return { label: "Start Practice", href: `/student/practice?skill=${encodeURIComponent(primaryGap)}` };
}

export function NextBestActionCard({ recommendation }: { recommendation: RecommendationDto | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!recommendation) {
    return (
      <div className="surface-card border-2 border-dashed border-[var(--border)] p-8 text-center">
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-[var(--muted)]" />
        <p className="font-medium text-[var(--foreground)]">No recommendation yet</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Select a target job role on your profile so we can compute your Next Best Action.
        </p>
      </div>
    );
  }

  const cta = ctaFor(recommendation.practiceType, recommendation.primaryGap);
  const learningTopics = recommendation.learningTopics ?? [];

  async function handleStart() {
    setBusy(true);
    try {
      await apiPost(`/api/recommendations/${recommendation!.id}/status`, { status: "STARTED" });
    } catch {
      // non-critical — still navigate even if the status update fails
    } finally {
      router.push(cta.href);
    }
  }

  return (
    <div className="surface-card relative overflow-hidden border-2 border-[var(--primary)]/20 p-6">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--primary-soft)] opacity-60" />
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]">
            <Flame className="h-4 w-4" /> YOUR NEXT BEST ACTION
          </span>
          <Badge tone={toneForPriority(recommendation.priority)}>{recommendation.priority} priority</Badge>
          {recommendation.source === "FALLBACK" && (
            <Badge tone="neutral">Rule-based recommendation</Badge>
          )}
        </div>

        <h2 className="text-xl font-bold text-[var(--foreground)]">Improve {recommendation.primaryGap}</h2>

        <p className="mt-2 text-sm text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">Why? </span>
          {recommendation.reason}
        </p>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
            <ListChecks className="h-4 w-4" /> Today&apos;s task
          </p>
          <p className="text-sm text-[var(--foreground)]">{recommendation.nextBestAction}</p>
          {learningTopics.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {learningTopics.map((t) => (
                <Badge key={t} tone="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <Clock className="h-4 w-4" /> Estimated time: {recommendation.estimatedMinutes} minutes
          </span>
          <Button onClick={handleStart} disabled={busy}>
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-3 text-xs text-[var(--muted)]">
          Success looks like: {recommendation.successMetric}
        </p>
      </div>
    </div>
  );
}
