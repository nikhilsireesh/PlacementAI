"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UploadCloud, Sparkles, CheckCircle2, AlertTriangle, FileQuestion } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, ClientApiError } from "@/lib/apiClient";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface UploadResult {
  assessmentId: string;
  title: string;
  isPractice: boolean;
  source: "AI" | "FALLBACK";
  questionsCreated: number;
  warnings: { questionNumber: number; reason: string }[];
}

const EXAMPLE_FORMAT = `1. What is the time complexity of binary search?
A) O(n)
B) O(log n)
C) O(n log n)
D) O(1)
Answer: B
Explanation: Binary search halves the search space each step.

2. Which data structure uses LIFO order?
A) Queue
B) Stack
C) Linked List
D) Array
Answer: B`;

export default function NewAssessmentPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [form, setForm] = useState({
    title: "",
    skillId: "",
    difficulty: "MEDIUM",
    isPractice: false,
    timeLimitMinutes: 20,
    topic: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    apiFetch<{ skills: Skill[] }>("/api/skills").then((res) => {
      setSkills(res.skills);
      if (res.skills[0]) setForm((f) => ({ ...f, skillId: res.skills[0].id }));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!form.title.trim() || !form.skillId) {
      setError("Give the assessment a title and choose a skill first.");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file && !pastedText.trim()) {
      setError("Upload a PDF file or paste the questions as text.");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.set("title", form.title);
      body.set("skillId", form.skillId);
      body.set("difficulty", form.difficulty);
      body.set("isPractice", String(form.isPractice));
      body.set("timeLimitMinutes", String(form.timeLimitMinutes));
      if (form.topic.trim()) body.set("topic", form.topic.trim());
      if (file) body.set("file", file);
      else body.set("text", pastedText);

      const res = await apiFetch<UploadResult>("/api/faculty/assessments/upload", {
        method: "POST",
        body,
      });
      setResult(res);
      setFileName(null);
      setPastedText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to process that upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/faculty/assessments" className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" /> Back to Assessments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Upload Questions</h1>
        <p className="text-[var(--muted)]">
          Upload a PDF (or paste text) containing multiple-choice questions and their options —
          it&apos;s parsed into a new assessment or practice set students can take immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-[var(--primary)]" /> Expected format
          </CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-[var(--muted)]">
          One question per block, numbered, with lettered options and an answer key. The answer
          line can give the option letter or the full answer text.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-[var(--foreground)] whitespace-pre-wrap">
          {EXAMPLE_FORMAT}
        </pre>
        <p className="mt-2 text-xs text-[var(--muted)]">
          If an AI key is configured, messier formatting is tolerated too — otherwise this exact
          pattern is parsed with a rule-based reader. Each question is worth 1 mark.
        </p>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Assessment title</Label>
              <Input
                id="title"
                required
                placeholder="e.g. Data Structures — Unit 3 Quiz"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="skill">Skill</Label>
              <Select id="skill" value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })}>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                id="difficulty"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="topic">Topic (optional)</Label>
              <Input
                id="topic"
                placeholder="e.g. Arrays"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.isPractice}
                  onChange={(e) => setForm({ ...form, isPractice: e.target.checked })}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                This is a quick practice set (untimed)
              </label>
            </div>
            {!form.isPractice && (
              <div>
                <Label htmlFor="timeLimit">Time limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={5}
                  max={180}
                  value={form.timeLimitMinutes}
                  onChange={(e) => setForm({ ...form, timeLimitMinutes: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center hover:bg-gray-50">
              <UploadCloud className="h-8 w-8 text-[var(--muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {fileName ?? "Click to upload a PDF or .txt question paper"}
              </span>
              <span className="text-xs text-[var(--muted)]">Max 8MB</span>
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
            or paste the questions as text
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste question text here…"
            className="min-h-[120px]"
          />

          <FieldError>{error}</FieldError>

          <Button type="submit" disabled={loading} className="w-full">
            <Sparkles className="h-4 w-4" />
            {loading ? "Parsing questions…" : "Upload & Create Assessment"}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="border-2 border-[var(--success)]/30 bg-[var(--success-soft)]/40">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)]">
                Created &ldquo;{result.title}&rdquo; with {result.questionsCreated} question
                {result.questionsCreated === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {result.isPractice ? "Added to Practice sets" : "Added to Assessments"} — visible to
                students immediately.
              </p>
              {result.source === "FALLBACK" && (
                <Badge tone="neutral" className="mt-2">
                  Parsed with the rule-based reader
                </Badge>
              )}
              {result.warnings.length > 0 && (
                <div className="mt-3 rounded-lg bg-white/60 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--warning)]">
                    <AlertTriangle className="h-4 w-4" /> {result.warnings.length} question(s) skipped
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-[var(--muted)]">
                    {result.warnings.map((w, i) => (
                      <li key={i}>
                        #{w.questionNumber}: {w.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link href="/faculty/assessments" className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
                View in Assessments →
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
