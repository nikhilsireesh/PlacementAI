/**
 * Central AI abstraction. Every AI-powered feature in the app goes through
 * one of these functions — nothing else calls the AI client directly. Each
 * function:
 *
 *  1. Builds a structured, minimal prompt from real application data.
 *  2. Calls the model and validates the JSON it returns.
 *  3. Falls back to a deterministic, rule-based result on any failure
 *     (missing key, timeout, invalid JSON, schema mismatch).
 *
 * Callers get a `{ source: "AI" | "FALLBACK", data }` envelope so the UI can
 * (optionally) show "AI personalization unavailable — showing rule-based
 * recommendation."
 */
import { chatComplete, extractJson, AiUnavailableError } from "./client";
import {
  recommendationSchema,
  resumeAnalysisSchema,
  interviewAnalysisSchema,
  roadmapSchema,
  coachAnswerSchema,
  facultyInsightSchema,
  parsedQuestionsSchema,
  type RecommendationOutput,
  type ResumeAnalysisOutput,
  type InterviewAnalysisOutput,
  type RoadmapOutput,
  type FacultyInsightOutput,
} from "@/lib/validation/ai";
import { buildFallbackRecommendation } from "@/lib/engine/nextBestAction";
import type { SkillGap } from "@/lib/engine/skillGap";
import {
  parseQuestionsDeterministic,
  type ParseResult,
  type ParseWarning,
} from "@/lib/services/questionParser";

export interface AiResult<T> {
  source: "AI" | "FALLBACK";
  data: T;
}

const GUARDRAIL_SYSTEM_PROMPT = `You are an academic placement-preparation assistant embedded in a college
platform. You help students understand their placement readiness and study
plan. Rules you must always follow:
- Only use the structured data given to you. Never invent scores, statistics, or facts.
- Never say a student "will definitely" or "will never" get placed, and never call a student unsuitable for a career.
- Use supportive, specific, and actionable language (e.g. "Your coding score is currently your biggest opportunity" rather than judgmental language).
- Always respond with a single valid JSON object only, matching the schema you are given. No prose outside the JSON.`;

// ── Next Best Action recommendation ───────────────────────────────────────

export async function generateRecommendation(
  gaps: SkillGap[],
  targetRoleName: string,
  completedActivities: string[] = []
): Promise<AiResult<RecommendationOutput>> {
  try {
    const input = {
      targetRole: targetRoleName,
      gaps: gaps.slice(0, 5).map((g) => ({
        skill: g.skillName,
        current: g.current,
        target: g.target,
        gap: g.gap,
        priority: g.priority,
        trend: g.trend,
      })),
      recentlyCompleted: completedActivities.slice(0, 5),
    };

    const raw = await chatComplete({
      system: GUARDRAIL_SYSTEM_PROMPT,
      user: `Student data:\n${JSON.stringify(input, null, 2)}\n\nReturn a JSON object with exactly these keys: primary_gap (string), secondary_gap (string), reason (1-2 sentences explaining why this is the top priority, referencing the actual numbers), next_best_action (a concrete task description), practice_type (short slug like "coding_practice"), estimated_minutes (integer), priority ("HIGH"|"MEDIUM"|"LOW" matching the gap's priority), learning_topics (array of 2-4 short topic strings), success_metric (a measurable statement of what improvement looks like).`,
      jsonMode: true,
    });

    const parsed = recommendationSchema.parse(extractJson(raw));
    return { source: "AI", data: parsed };
  } catch (err) {
    logAiFailure("generateRecommendation", err);
    return {
      source: "FALLBACK",
      data: buildFallbackRecommendation(gaps, targetRoleName),
    };
  }
}

// ── Resume analysis ────────────────────────────────────────────────────────

const COMMON_SKILL_KEYWORDS = [
  "Java", "Python", "C++", "JavaScript", "TypeScript", "SQL", "HTML",
  "CSS", "React", "Node.js", "Express", "Django", "Flask", "Spring Boot",
  "DSA", "Data Structures", "Algorithms", "Git", "Docker", "Kubernetes",
  "AWS", "Machine Learning", "Pandas", "NumPy", "REST API", "MongoDB",
  "PostgreSQL", "MySQL", "Linux", "OOP", "System Design",
];

/** Word-boundary, case-insensitive match — plain substring matching would let
 * a keyword like "C" match inside "CSS" or "MySQL" and produce false positives. */
function containsKeyword(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(text);
}

function fallbackResumeAnalysis(
  resumeText: string,
  targetRole: string,
  targetSkillNames: string[]
): ResumeAnalysisOutput {
  const detectedSkills = COMMON_SKILL_KEYWORDS.filter((kw) => containsKeyword(resumeText, kw));
  const missing = targetSkillNames.filter((s) => !containsKeyword(resumeText, s));
  const projectMatches = resumeText.match(/project[s]?[:\s][^\n]{0,120}/gi) ?? [];

  return {
    detected_skills: detectedSkills,
    detected_projects: projectMatches.slice(0, 5).map((p) => p.trim()),
    role_alignment_summary: `Your resume mentions ${detectedSkills.length} recognizable technical keyword(s) out of ${COMMON_SKILL_KEYWORDS.length} scanned. For a ${targetRole} role, ${missing.length > 0 ? `we did not find clear evidence of: ${missing.join(", ")}.` : "your keywords appear reasonably aligned."}`,
    missing_skills: missing,
    strengths: detectedSkills.length > 0
      ? [`Demonstrates familiarity with ${detectedSkills.slice(0, 3).join(", ")}`]
      : ["Resume uploaded successfully"],
    improvement_suggestions: [
      "Quantify project outcomes with numbers (e.g. users, performance improvement, dataset size).",
      "Add links to GitHub or live project demos if available.",
      missing.length > 0
        ? `Add relevant experience or coursework related to: ${missing.slice(0, 3).join(", ")}.`
        : "Keep technical skills section up to date with your most recent work.",
    ],
    overall_feedback:
      "This is a rule-based analysis (AI personalization unavailable). It highlights keyword matches only — a human review is recommended for tone, formatting, and impact.",
  };
}

export async function analyzeResume(
  resumeText: string,
  targetRole: string,
  targetSkillNames: string[]
): Promise<AiResult<ResumeAnalysisOutput>> {
  try {
    const truncated = resumeText.slice(0, 6000);
    const raw = await chatComplete({
      system: GUARDRAIL_SYSTEM_PROMPT,
      user: `Target role: ${targetRole}\nRole-relevant skills to check for: ${targetSkillNames.join(", ")}\n\nResume text:\n"""\n${truncated}\n"""\n\nReturn a JSON object with exactly these keys: detected_skills (string array), detected_projects (string array, short titles/snippets), role_alignment_summary (1-3 sentences, honest and specific, do not claim ATS pass/fail), missing_skills (string array, skills relevant to the role not evidenced in the resume), strengths (string array), improvement_suggestions (string array of concrete, actionable suggestions), overall_feedback (1-2 sentences).`,
      jsonMode: true,
    });
    const parsed = resumeAnalysisSchema.parse(extractJson(raw));
    return { source: "AI", data: parsed };
  } catch (err) {
    logAiFailure("analyzeResume", err);
    return { source: "FALLBACK", data: fallbackResumeAnalysis(resumeText, targetRole, targetSkillNames) };
  }
}

// ── Mock interview analysis ────────────────────────────────────────────────

function fallbackInterviewAnalysis(answer: string): InterviewAnalysisOutput {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasExample = /for example|e\.g\.|instance|project|experience/i.test(answer);
  const hasStructure = /first|second|then|finally|because|therefore/i.test(answer);

  let score = 40;
  if (wordCount > 30) score += 15;
  if (wordCount > 80) score += 10;
  if (hasExample) score += 15;
  if (hasStructure) score += 15;
  score = Math.min(90, score); // rule-based scoring is capped below "AI-verified" ceiling

  const strengths: string[] = [];
  const improve: string[] = [];
  if (hasExample) strengths.push("Included a concrete example or experience.");
  else improve.push("Add a specific example or past experience to support your answer.");
  if (hasStructure) strengths.push("Answer follows a logical structure.");
  else improve.push("Structure your answer (e.g. situation → action → result).");
  if (wordCount < 30) improve.push("Expand your answer with more detail — it currently looks brief.");
  if (strengths.length === 0) strengths.push("Attempted the question with a relevant response.");

  return {
    score,
    strengths,
    areas_to_improve: improve,
    missing_points: ["This is a rule-based estimate — enable an AI key for deeper technical-accuracy feedback."],
    next_action: "Practice 2-3 more questions of this type and compare your structure across attempts.",
  };
}

export async function analyzeInterview(
  question: string,
  answer: string,
  jobRoleName: string,
  interviewType: string
): Promise<AiResult<InterviewAnalysisOutput>> {
  try {
    const raw = await chatComplete({
      system: GUARDRAIL_SYSTEM_PROMPT,
      user: `Job role: ${jobRoleName}\nInterview type: ${interviewType}\nQuestion: "${question}"\nCandidate's written answer: """${answer.slice(0, 3000)}"""\n\nEvaluate relevance, technical correctness (if applicable), completeness, structure, and clarity. Do not claim to assess emotion, personality, or tone of voice. Return a JSON object with exactly these keys: score (0-100 integer), strengths (string array), areas_to_improve (string array), missing_points (string array of important points the answer omitted), next_action (one sentence, concrete next step).`,
      jsonMode: true,
    });
    const parsed = interviewAnalysisSchema.parse(extractJson(raw));
    return { source: "AI", data: parsed };
  } catch (err) {
    logAiFailure("analyzeInterview", err);
    return { source: "FALLBACK", data: fallbackInterviewAnalysis(answer) };
  }
}

// ── Roadmap generation ─────────────────────────────────────────────────────

function fallbackRoadmap(gaps: SkillGap[], days: number): RoadmapOutput {
  const priorityGaps = gaps.filter((g) => g.gap > 0).slice(0, 4);
  const pool = priorityGaps.length > 0 ? priorityGaps : gaps.slice(0, 2);
  const out: RoadmapOutput["days"] = [];

  for (let day = 1; day <= days; day++) {
    const gap = pool[(day - 1) % pool.length];
    const isMockInterviewDay = day % 4 === 0;
    const isResumeDay = day % 7 === 0;

    if (isResumeDay) {
      out.push({
        day,
        focus: "Resume Improvement",
        tasks: ["Review resume analyzer feedback", "Update project descriptions with measurable outcomes"],
        estimated_minutes: 30,
      });
    } else if (isMockInterviewDay) {
      out.push({
        day,
        focus: "Mock Interview",
        tasks: ["Complete one mock interview session", "Review AI/rule-based feedback"],
        estimated_minutes: 20,
      });
    } else if (gap) {
      out.push({
        day,
        focus: gap.skillName,
        tasks: [`5 practice questions on ${gap.skillName}`, "Review incorrect answers and explanations"],
        estimated_minutes: 30,
      });
    } else {
      out.push({
        day,
        focus: "General Review",
        tasks: ["Revisit weakest topic from this week"],
        estimated_minutes: 20,
      });
    }
  }
  return { days: out };
}

export async function generateRoadmap(
  gaps: SkillGap[],
  targetRoleName: string,
  days = 14
): Promise<AiResult<RoadmapOutput>> {
  try {
    const input = {
      targetRole: targetRoleName,
      gaps: gaps.slice(0, 5).map((g) => ({ skill: g.skillName, current: g.current, target: g.target, gap: g.gap })),
      days,
    };
    const raw = await chatComplete({
      system: GUARDRAIL_SYSTEM_PROMPT,
      user: `Build a ${days}-day placement preparation roadmap from this data:\n${JSON.stringify(input, null, 2)}\n\nReturn a JSON object: { "days": [ { "day": 1, "focus": "...", "tasks": ["..."], "estimated_minutes": 30 }, ... ] } with exactly ${days} entries, prioritizing the largest gaps, and including at least one mock-interview day and one resume-review day.`,
      jsonMode: true,
    });
    const parsed = roadmapSchema.parse(extractJson(raw));
    return { source: "AI", data: parsed };
  } catch (err) {
    logAiFailure("generateRoadmap", err);
    return { source: "FALLBACK", data: fallbackRoadmap(gaps, days) };
  }
}

// ── AI Coach (uses real student profile, never generic) ────────────────────

export interface CoachContext {
  targetRole: string;
  readinessScore: number;
  readinessLevel: string;
  confidence: number;
  skills: { name: string; current: number; target: number }[];
  topGaps: { name: string; gap: number }[];
  recentTrend?: string;
}

function fallbackCoachAnswer(question: string, ctx: CoachContext): string {
  const q = question.toLowerCase();
  const top = ctx.topGaps[0];
  const second = ctx.topGaps[1];

  if (/why.*low|readiness.*low|why.*not ready/.test(q)) {
    return `Your current readiness score is ${ctx.readinessScore}/100 (${ctx.readinessLevel}). This is calculated from your skill scores weighted for ${ctx.targetRole}. Your biggest contributor to the gap is ${top ? `${top.name} (${top.gap} points below target)` : "a skill still below target"}${second ? `, followed by ${second.name}` : ""}. Focus there first for the fastest overall improvement.`;
  }
  if (/what.*study today|what should i do|next|improve/.test(q)) {
    return top
      ? `Based on your current profile, your highest-impact action today is practicing ${top.name} — it's ${top.gap} points below the target for ${ctx.targetRole}. Check your "Next Best Action" card on the dashboard for a specific task.`
      : `Your tracked skills are close to target for ${ctx.targetRole}. Consider attempting a harder assessment or reviewing your resume for further gains.`;
  }
  if (/ready.*role|am i ready/.test(q)) {
    return `Based on your current assessment data, your readiness for ${ctx.targetRole} is ${ctx.readinessScore}/100 (${ctx.readinessLevel}), with ${ctx.confidence}% confidence given the amount of assessment data available. This reflects current preparation, not a guarantee of outcome.`;
  }
  if (/decreas|declin|drop/.test(q)) {
    return ctx.recentTrend
      ? `${ctx.recentTrend} Review your recent assessment attempts on the Progress page for the specific scores involved.`
      : `I don't see a clear declining trend in your recent data. Check the Progress page for a skill-by-skill history.`;
  }
  return `Your readiness for ${ctx.targetRole} is currently ${ctx.readinessScore}/100 (${ctx.readinessLevel}). Your top opportunity is ${top ? `${top.name}` : "maintaining your current skills"}. Ask me things like "What should I study today?" or "Why is my readiness low?" for more specific guidance.`;
}

export async function answerStudentQuestion(
  question: string,
  ctx: CoachContext
): Promise<AiResult<string>> {
  try {
    const raw = await chatComplete({
      system: GUARDRAIL_SYSTEM_PROMPT,
      user: `Student profile (all numbers are real, computed by the platform — use them, do not invent new ones):\n${JSON.stringify(ctx, null, 2)}\n\nStudent's question: "${question}"\n\nReturn a JSON object: { "answer": "..." }. The answer must reference the student's actual numbers where relevant, be specific (not generic advice), stay under 6 sentences, and follow the safety rules in your system prompt.`,
      jsonMode: true,
    });
    const parsed = coachAnswerSchema.parse(extractJson(raw));
    return { source: "AI", data: parsed.answer };
  } catch (err) {
    logAiFailure("answerStudentQuestion", err);
    return { source: "FALLBACK", data: fallbackCoachAnswer(question, ctx) };
  }
}

// ── Faculty aggregated insight ─────────────────────────────────────────────

export interface FacultyStatsInput {
  totalStudents: number;
  averageReadiness: number;
  skillGapDistribution: { skill: string; belowTargetPercent: number }[];
  department?: string;
}

function fallbackFacultyInsight(stats: FacultyStatsInput): FacultyInsightOutput {
  const sorted = [...stats.skillGapDistribution].sort((a, b) => b.belowTargetPercent - a.belowTargetPercent);
  const top = sorted[0];
  const scope = stats.department ? `Among ${stats.department} students` : "Across all students";
  return {
    summary: top
      ? `${scope}, ${top.skill} is the most common skill gap: ${top.belowTargetPercent}% are below the target threshold. Average readiness is ${stats.averageReadiness}/100 across ${stats.totalStudents} students.`
      : `${scope}, average readiness is ${stats.averageReadiness}/100 across ${stats.totalStudents} students.`,
    suggested_intervention: top
      ? `Consider a focused workshop or bootcamp on ${top.skill} for the affected students, followed by a re-assessment in 2-3 weeks to measure impact.`
      : "Continue current preparation programs and monitor readiness trends.",
  };
}

export async function generateFacultyInsight(
  stats: FacultyStatsInput
): Promise<AiResult<FacultyInsightOutput>> {
  try {
    const raw = await chatComplete({
      system: `${GUARDRAIL_SYSTEM_PROMPT}\nYou must only summarize the aggregated statistics given to you. Never invent student counts, names, or percentages that are not present in the input.`,
      user: `Aggregated faculty statistics (all real, computed by the platform):\n${JSON.stringify(stats, null, 2)}\n\nReturn a JSON object with exactly these keys: summary (1-3 sentences summarizing the data, using only the numbers given), suggested_intervention (1-2 sentences of practical, actionable faculty intervention).`,
      jsonMode: true,
    });
    const parsed = facultyInsightSchema.parse(extractJson(raw));
    return { source: "AI", data: parsed };
  } catch (err) {
    logAiFailure("generateFacultyInsight", err);
    return { source: "FALLBACK", data: fallbackFacultyInsight(stats) };
  }
}

// ── Question-bank PDF parsing (faculty uploads) ─────────────────────────────

const MAX_QUESTION_TEXT_CHARS = 12_000;

export async function parseQuestionsFromPdf(rawText: string): Promise<AiResult<ParseResult>> {
  try {
    const truncated = rawText.slice(0, MAX_QUESTION_TEXT_CHARS);
    const raw = await chatComplete({
      system: `You extract multiple-choice questions from raw, possibly messy text extracted from a PDF question paper. Only extract questions that are actually present in the text — never invent questions. Always respond with a single valid JSON object only.`,
      user: `Extract every multiple-choice question from this text. For each one return its question text, its options (verbatim, in order), and its correct answer — the correct answer string must be copied EXACTLY from one of that question's options (not just the letter). Include an explanation only if one is present in the text.\n\nText:\n"""\n${truncated}\n"""\n\nReturn a JSON object: { "questions": [ { "text": "...", "options": ["...", "..."], "correctAnswer": "...", "explanation": "..." } ] }. Skip anything that isn't clearly a question with at least two options.`,
      jsonMode: true,
    });
    const parsed = parsedQuestionsSchema.parse(extractJson(raw));

    // Belt-and-braces: even though the prompt requires it, re-verify every
    // correctAnswer literally matches one of that question's options —
    // grading later compares against this field verbatim.
    const questions: ParseResult["questions"] = [];
    const warnings: ParseWarning[] = [];
    parsed.questions.forEach((q, i) => {
      if (!q.options.includes(q.correctAnswer)) {
        warnings.push({
          questionNumber: i + 1,
          reason: "AI-extracted answer didn't exactly match one of the options — skipped.",
        });
        return;
      }
      questions.push(q);
    });

    if (questions.length === 0) throw new Error("AI extracted no valid questions");
    return { source: "AI", data: { questions, warnings } };
  } catch (err) {
    logAiFailure("parseQuestionsFromPdf", err);
    return { source: "FALLBACK", data: parseQuestionsDeterministic(rawText) };
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

function logAiFailure(fn: string, err: unknown) {
  // Never log request/response bodies (may contain student data) — just the
  // failure reason, and only server-side.
  const reason = err instanceof AiUnavailableError ? err.message : err instanceof Error ? err.message : "unknown error";
  console.warn(`[aiService] ${fn} falling back to deterministic engine: ${reason}`);
}
