"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { QuestionCard, type QuestionDto } from "@/components/assessment/QuestionCard";
import { apiPost, ClientApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

interface StartResponse {
  attemptId: string;
  assessment: { id: string; title: string; timeLimitMinutes: number; totalMarks: number };
  questions: QuestionDto[];
}

interface ReviewRow {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

interface SubmitResponse {
  result: { rawScore: number; totalMarks: number; percentage: number; previousPercentage: number | null; improvementPct: number | null };
  skillUpdate: { skillBefore: number; skillAfter: number };
  review: ReviewRow[];
}

export function TakeAssessment({ assessmentId }: { assessmentId: string }) {
  const { push } = useToast();
  const [state, setState] = useState<"loading" | "in-progress" | "submitting" | "done" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<StartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    apiPost<StartResponse>("/api/assessments/start", { assessmentId })
      .then((res) => {
        setData(res);
        setSecondsLeft(res.assessment.timeLimitMinutes * 60);
        setState("in-progress");
      })
      .catch((err) => {
        setErrorMessage(err instanceof ClientApiError ? err.message : "Unable to start this assessment.");
        setState("error");
      });
  }, [assessmentId]);

  useEffect(() => {
    if (state !== "in-progress" || secondsLeft == null) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, state]);

  async function handleSubmit() {
    if (!data || state === "submitting" || state === "done") return;
    setState("submitting");
    try {
      const payload = {
        attemptId: data.attemptId,
        answers: data.questions.map((q) => ({ questionId: q.id, answerText: answers[q.id] ?? "" })),
      };
      const res = await apiPost<SubmitResponse>("/api/assessments/submit", payload);
      setResult(res);
      setState("done");
      push({ title: "Assessment submitted", description: `Score: ${res.result.percentage}%`, tone: "success" });
    } catch (err) {
      setErrorMessage(err instanceof ClientApiError ? err.message : "Unable to submit your assessment.");
      setState("error");
    }
  }

  if (state === "loading") return <LoadingState label="Preparing your assessment…" />;
  if (state === "error") return <ErrorState message={errorMessage} />;
  if (!data) return null;

  if (state === "done" && result) {
    const reviewMap = new Map(result.review.map((r) => [r.questionId, r]));
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[var(--success)]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{result.result.percentage}%</h1>
          <p className="text-[var(--muted)]">
            {result.result.rawScore} / {result.result.totalMarks} marks
            {result.result.improvementPct != null && (
              <> · {result.result.improvementPct >= 0 ? "+" : ""}{result.result.improvementPct} pts vs. last attempt</>
            )}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Skill score updated: {result.skillUpdate.skillBefore}% → {result.skillUpdate.skillAfter}%
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/student/dashboard">
              <Button>
                View updated dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/student/assessments">
              <Button variant="outline">Back to Assessments</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold text-[var(--foreground)]">Review your answers</h2>
          {data.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              value={answers[q.id] ?? ""}
              onChange={() => {}}
              review={reviewMap.get(q.id) ?? null}
            />
          ))}
        </div>
      </div>
    );
  }

  const minutes = secondsLeft != null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft != null ? secondsLeft % 60 : 0;
  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.assessment.title}</CardTitle>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
            <Clock className="h-4 w-4" />
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </CardHeader>
        <p className="text-sm text-[var(--muted)]">
          {answeredCount} / {data.questions.length} answered
        </p>
      </Card>

      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            value={answers[q.id] ?? ""}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={state === "submitting"}>
        {state === "submitting" ? "Submitting…" : "Submit Assessment"}
      </Button>
    </div>
  );
}
