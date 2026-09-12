"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { QuestionCard, type QuestionDto } from "@/components/assessment/QuestionCard";
import { apiFetch, apiPost, ClientApiError } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

interface PracticeResponse {
  practiceSet: { id: string; title: string; skill: string };
  questions: QuestionDto[];
}

interface ReviewRow {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

interface SubmitResponse {
  result: { rawScore: number; totalMarks: number; percentage: number; questionsCorrect: number; questionsAttempted: number };
  skillUpdate: { skillBefore: number; skillAfter: number };
  review: ReviewRow[];
}

export function TakePractice({ practiceId }: { practiceId: string }) {
  const { push } = useToast();
  const [state, setState] = useState<"loading" | "in-progress" | "submitting" | "done" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<PracticeResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    apiFetch<PracticeResponse>(`/api/practice/${practiceId}`)
      .then((res) => {
        setData(res);
        setState("in-progress");
      })
      .catch((err) => {
        setErrorMessage(err instanceof ClientApiError ? err.message : "Unable to load this practice set.");
        setState("error");
      });
  }, [practiceId]);

  async function handleSubmit() {
    if (!data) return;
    setState("submitting");
    try {
      const payload = {
        assessmentId: practiceId,
        answers: data.questions.map((q) => ({ questionId: q.id, answerText: answers[q.id] ?? "" })),
        timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
      };
      const res = await apiPost<SubmitResponse>("/api/practice/submit", payload);
      setResult(res);
      setState("done");
      push({ title: "Practice complete", description: `${res.result.questionsCorrect}/${res.result.questionsAttempted} correct`, tone: "success" });
    } catch (err) {
      setErrorMessage(err instanceof ClientApiError ? err.message : "Unable to submit your practice session.");
      setState("error");
    }
  }

  if (state === "loading") return <LoadingState label="Loading practice set…" />;
  if (state === "error") return <ErrorState message={errorMessage} />;
  if (!data) return null;

  if (state === "done" && result) {
    const reviewMap = new Map(result.review.map((r) => [r.questionId, r]));
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[var(--success)]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {result.result.questionsCorrect} / {result.result.questionsAttempted} correct
          </h1>
          <p className="text-[var(--muted)]">Score: {result.result.percentage}%</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Skill score updated: {result.skillUpdate.skillBefore}% → {result.skillUpdate.skillAfter}%
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/student/dashboard">
              <Button>
                View updated dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/student/practice">
              <Button variant="outline">Back to Practice</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-3">
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.practiceSet.title}</CardTitle>
        </CardHeader>
        <p className="text-sm text-[var(--muted)]">Untimed · {data.questions.length} questions</p>
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
        {state === "submitting" ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );
}
