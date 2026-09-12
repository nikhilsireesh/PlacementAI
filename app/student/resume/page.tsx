"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";
import { apiFetch, ClientApiError } from "@/lib/apiClient";

interface ResumeAnalysis {
  detected_skills: string[];
  detected_projects: string[];
  role_alignment_summary: string;
  missing_skills: string[];
  strengths: string[];
  improvement_suggestions: string[];
  overall_feedback: string;
}

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: ResumeAnalysis; source: "AI" | "FALLBACK" } | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        form.append("file", file);
      } else if (pastedText.trim()) {
        form.append("text", pastedText);
      } else {
        throw new ClientApiError("Upload a resume file or paste your resume text first.");
      }
      const res = await apiFetch<{ analysis: ResumeAnalysis; source: "AI" | "FALLBACK" }>("/api/resume/analyze", {
        method: "POST",
        body: form,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to analyze your resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Resume Analyzer</h1>
        <p className="text-[var(--muted)]">
          Get feedback on how well your resume aligns with your target role. This is guidance, not a
          guarantee of ATS approval or interview outcomes.
        </p>
      </div>

      <Card>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center hover:bg-gray-50">
              <UploadCloud className="h-8 w-8 text-[var(--muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {fileName ?? "Click to upload a PDF or .txt resume"}
              </span>
              <span className="text-xs text-[var(--muted)]">Max 5MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            or paste text
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your resume text here…"
            className="min-h-[140px]"
          />

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-[var(--danger)]">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing…" : "Analyze Resume"}
          </Button>
        </form>
      </Card>

      {loading && <LoadingState label="Analyzing your resume…" />}

      {result && (
        <div className="space-y-4">
          {result.source === "FALLBACK" && (
            <Badge tone="neutral">AI personalization unavailable — showing rule-based analysis</Badge>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Role Alignment</CardTitle>
            </CardHeader>
            <p className="text-sm text-[var(--foreground)]">{result.analysis.role_alignment_summary}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Detected Skills</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {result.analysis.detected_skills.length > 0 ? (
                  result.analysis.detected_skills.map((s) => <Badge key={s} tone="success">{s}</Badge>)
                ) : (
                  <p className="text-sm text-[var(--muted)]">No clear technical keywords detected.</p>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Missing / Underrepresented Skills</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {result.analysis.missing_skills.length > 0 ? (
                  result.analysis.missing_skills.map((s) => <Badge key={s} tone="warning">{s}</Badge>)
                ) : (
                  <p className="text-sm text-[var(--muted)]">No major gaps detected against your target role.</p>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--foreground)]">
              {result.analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" /> {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Improvement Suggestions</CardTitle>
            </CardHeader>
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--foreground)]">
              {result.analysis.improvement_suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>

          <Card className="bg-gray-50">
            <p className="flex items-start gap-2 text-sm text-[var(--muted)]">
              <FileText className="mt-0.5 h-4 w-4 shrink-0" /> {result.analysis.overall_feedback}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
