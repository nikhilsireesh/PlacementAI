"use client";

import { useState } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiPost, ClientApiError } from "@/lib/apiClient";

interface Message {
  role: "user" | "assistant";
  text: string;
  source?: "AI" | "FALLBACK";
}

const SUGGESTIONS = [
  "Why is my readiness score low?",
  "What should I study today?",
  "How can I improve my coding?",
  "Am I ready for my target role?",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your AI Coach. Ask me about your readiness, skill gaps, or what to study next — I'll answer using your actual profile data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiPost<{ answer: string; source: "AI" | "FALLBACK" }>("/api/coach/ask", { question });
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer, source: res.source }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            err instanceof ClientApiError
              ? err.message
              : "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col space-y-4 lg:h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">AI Coach</h1>
        <p className="text-[var(--muted)]">Grounded in your real assessment data — not generic advice.</p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)]">
                  <Bot className="h-4 w-4 text-[var(--primary)]" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-[var(--foreground)]"
                }`}
              >
                {m.text}
                {m.source === "FALLBACK" && (
                  <div className="mt-1.5">
                    <Badge tone="neutral">Rule-based answer</Badge>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Sparkles className="h-4 w-4 animate-pulse" /> Thinking…
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-[var(--border)] p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your readiness, gaps, or next steps…"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
