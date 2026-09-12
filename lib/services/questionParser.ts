/**
 * Deterministic parser that turns plain text (typically extracted from a
 * faculty-uploaded PDF) into structured MCQ questions. This is the
 * fallback path used whenever the AI parser is unavailable or fails —
 * uploading a question bank must work even with no AI key configured.
 *
 * Expected format (one question per block, separated by a blank line or a
 * new numbered question):
 *
 *   1. What is the time complexity of binary search?
 *   A) O(n)
 *   B) O(log n)
 *   C) O(n log n)
 *   D) O(1)
 *   Answer: B
 *   Explanation: Binary search halves the search space each step.
 *
 * The answer line may give the option letter ("Answer: B") or the full
 * answer text ("Answer: O(log n)") — both are accepted.
 */

export interface ParsedQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface ParseWarning {
  questionNumber: number;
  reason: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  warnings: ParseWarning[];
}

const QUESTION_START_RE = /^(?:Q\.?\s*)?(\d{1,3})[.)]\s+(.*)$/i;
const OPTION_RE = /^\(?([A-Za-z])\)?[.)]\s+(.*)$/;
const ANSWER_RE = /^(?:correct\s*)?answer\s*[:\-]\s*(.*)$/i;
const EXPLANATION_RE = /^explanation\s*[:\-]\s*(.*)$/i;

interface RawBlock {
  number: number;
  textLines: string[];
  options: Map<string, string>; // letter (lowercase) -> option text, insertion order preserved
  answerRaw: string | null;
  explanationLines: string[];
}

function splitIntoBlocks(text: string): RawBlock[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: RawBlock[] = [];
  let current: RawBlock | null = null;
  // "state" tracks which field newly-encountered plain lines should extend.
  let state: "question" | "explanation" | "other" = "question";

  for (const line of lines) {
    const qMatch = line.match(QUESTION_START_RE);
    if (qMatch) {
      if (current) blocks.push(current);
      current = {
        number: parseInt(qMatch[1], 10),
        textLines: [qMatch[2]],
        options: new Map(),
        answerRaw: null,
        explanationLines: [],
      };
      state = "question";
      continue;
    }
    if (!current) continue; // ignore any preamble before the first question

    const optMatch = line.match(OPTION_RE);
    // Only treat as an option if the letter is a plausible option letter
    // (A-F) — avoids misreading a sentence that happens to start "I. ...".
    if (optMatch && /^[A-Fa-f]$/.test(optMatch[1])) {
      current.options.set(optMatch[1].toLowerCase(), optMatch[2].trim());
      state = "other";
      continue;
    }

    const ansMatch = line.match(ANSWER_RE);
    if (ansMatch) {
      current.answerRaw = ansMatch[1].trim();
      state = "other";
      continue;
    }

    const expMatch = line.match(EXPLANATION_RE);
    if (expMatch) {
      current.explanationLines.push(expMatch[1].trim());
      state = "explanation";
      continue;
    }

    // Unclassified line — extend whichever field we were last building.
    if (state === "question") current.textLines.push(line);
    else if (state === "explanation") current.explanationLines.push(line);
    // else: stray line after options/answer with no clear owner — dropped.
  }
  if (current) blocks.push(current);
  return blocks;
}

function resolveCorrectAnswer(block: RawBlock, options: string[]): string | null {
  if (!block.answerRaw) return null;
  const raw = block.answerRaw.trim();

  // Single-letter answer key, e.g. "B" or "(B)".
  const letterMatch = raw.match(/^\(?([A-Za-z])\)?\.?$/);
  if (letterMatch) {
    const letter = letterMatch[1].toLowerCase();
    const byLetter = block.options.get(letter);
    if (byLetter) return byLetter;
  }

  // Full-text answer — match case-insensitively against the option list.
  const normalized = raw.toLowerCase();
  const byText = options.find((o) => o.toLowerCase() === normalized);
  return byText ?? null;
}

export function parseQuestionsDeterministic(text: string): ParseResult {
  const blocks = splitIntoBlocks(text);
  const questions: ParsedQuestion[] = [];
  const warnings: ParseWarning[] = [];

  for (const block of blocks) {
    const questionText = block.textLines.join(" ").trim();
    const options = [...block.options.values()];

    if (!questionText) {
      warnings.push({ questionNumber: block.number, reason: "Empty question text — skipped." });
      continue;
    }
    if (options.length < 2) {
      warnings.push({
        questionNumber: block.number,
        reason: `Only ${options.length} option(s) found (need at least 2) — skipped.`,
      });
      continue;
    }
    const correctAnswer = resolveCorrectAnswer(block, options);
    if (!correctAnswer) {
      warnings.push({
        questionNumber: block.number,
        reason: block.answerRaw
          ? `Answer key "${block.answerRaw}" didn't match any option — skipped.`
          : "No answer key found (expected a line like \"Answer: B\") — skipped.",
      });
      continue;
    }

    questions.push({
      text: questionText,
      options,
      correctAnswer,
      explanation: block.explanationLines.length > 0 ? block.explanationLines.join(" ") : undefined,
    });
  }

  return { questions, warnings };
}
