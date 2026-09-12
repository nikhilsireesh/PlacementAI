/**
 * Thin, provider-agnostic client for an OpenAI-compatible chat-completions
 * endpoint. Swapping providers (Groq, OpenRouter, a self-hosted Ollama
 * server, etc.) only requires changing AI_BASE_URL / AI_MODEL / AI_API_KEY —
 * nothing else in the app depends on a specific vendor SDK.
 */

const TIMEOUT_MS = 12_000;

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0);
}

interface ChatCompletionArgs {
  system: string;
  user: string;
  /** Ask the model to return a JSON object (supported by Groq/OpenAI-compatible APIs). */
  jsonMode?: boolean;
  temperature?: number;
}

export class AiUnavailableError extends Error {}

/** Calls the configured chat-completions endpoint and returns the raw text content. */
export async function chatComplete({
  system,
  user,
  jsonMode = false,
  temperature = 0.4,
}: ChatCompletionArgs): Promise<string> {
  if (!isAiConfigured()) {
    throw new AiUnavailableError("AI_API_KEY is not configured");
  }

  const baseUrl = (process.env.AI_BASE_URL || "https://api.groq.com/openai/v1").replace(
    /\/$/,
    ""
  );
  const model = process.env.AI_MODEL || "llama-3.3-70b-versatile";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AiUnavailableError(`AI request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new AiUnavailableError("AI response had no content");
    }
    return content;
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    throw new AiUnavailableError(
      err instanceof Error ? err.message : "AI request failed"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Extracts a JSON object from a model response, tolerating ```json fences. */
export function extractJson<T = unknown>(raw: string): T {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in AI response");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}
