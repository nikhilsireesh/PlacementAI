"use client";

import { useEffect, useState } from "react";
import { Mic, Sparkles, ArrowRight, ThumbsUp, ThumbsDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select, Textarea, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";
import { apiFetch, apiPost, ClientApiError } from "@/lib/apiClient";

interface JobRole {
  id: string;
  name: string;
}

interface InterviewAnalysis {
  score: number;
  strengths: string[];
  areas_to_improve: string[];
  missing_points: string[];
  next_action: string;
}

type Step = "setup" | "answering" | "result";

export default function InterviewPage() {
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [jobRoleId, setJobRoleId] = useState("");
  const [type, setType] = useState<"HR" | "TECHNICAL" | "BEHAVIORAL">("TECHNICAL");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [step, setStep] = useState<Step>("setup");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ analysis: InterviewAnalysis; source: "AI" | "FALLBACK" } | null>(null);

  useEffect(() => {
    apiFetch<{ jobRoles: JobRole[] }>("/api/job-roles").then((res) => {
      setJobRoles(res.jobRoles);
      if (res.jobRoles[0]) setJobRoleId(res.jobRoles[0].id);
    });
  }, []);

  async function handleGetQuestion() {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ questions: string[] }>(
        `/api/interview/questions?type=${type}&difficulty=${difficulty}`
      );
      setQuestion(res.questions[0] ?? "Tell me about yourself.");
      setStep("answering");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to load a question.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost<{ analysis: InterviewAnalysis; source: "AI" | "FALLBACK" }>(
        "/api/interview/analyze",
        { jobRoleId, type, difficulty, question, answer }
      );
      setResult(res);
      setStep("result");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to analyze your answer.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("setup");
    setAnswer("");
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Mock Interview</h1>
        <p className="text-[var(--muted)]">
          Practice with written answers and get structured feedback. This does not assess tone,
          emotion, or personality — only the content of your answer.
        </p>
      </div>

      {step === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Set up your session</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Job role</Label>
              <Select id="role" value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)}>
                {jobRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Interview type</Label>
              <Select id="type" value={type} onChange={(e) => setType(e.target.value as "HR" | "TECHNICAL" | "BEHAVIORAL")}>
                <option value="TECHNICAL">Technical</option>
                <option value="HR">HR</option>
                <option value="BEHAVIORAL">Behavioral</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <Button onClick={handleGetQuestion} disabled={loading || !jobRoleId} className="w-full">
              <Mic className="h-4 w-4" />
              {loading ? "Loading…" : "Start Interview"}
            </Button>
          </div>
        </Card>
      )}

      {step === "answering" && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Question</CardTitle>
            <Badge tone="secondary">{type}</Badge>
          </CardHeader>
          <p className="mb-4 rounded-lg bg-gray-50 p-4 font-medium text-[var(--foreground)]">{question}</p>
          <Label htmlFor="answer">Your answer</Label>
          <Textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer as you would say it out loud…"
            className="min-h-[160px]"
          />
          {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
          <Button onClick={handleSubmitAnswer} disabled={loading || !answer.trim()} className="mt-4 w-full">
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing…" : "Submit Answer"}
          </Button>
        </Card>
      )}

      {loading && step === "answering" && <LoadingState label="Analyzing your answer…" />}

      {step === "result" && result && (
        <div className="space-y-4">
          <Card className="text-center">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">{Math.round(result.analysis.score)}/100</h2>
            {result.source === "FALLBACK" && <Badge tone="neutral">Rule-based estimate</Badge>}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-[var(--success)]" /> Strengths
              </CardTitle>
            </CardHeader>
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--foreground)]">
              {result.analysis.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-[var(--warning)]" /> Areas to Improve
              </CardTitle>
            </CardHeader>
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--foreground)]">
              {result.analysis.areas_to_improve.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Card>

          <Card className="border-2 border-[var(--primary)]/20 bg-[var(--primary-soft)]/40">
            <p className="flex items-start gap-2 text-sm font-medium text-[var(--foreground)]">
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" /> Next action: {result.analysis.next_action}
            </p>
          </Card>

          <Button onClick={reset} variant="outline" className="w-full">
            Practice another question <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
