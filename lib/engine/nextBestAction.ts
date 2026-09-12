import type { Priority } from "@prisma/client";
import type { SkillGap } from "./skillGap";

export interface NextBestAction {
  primary_gap: string;
  secondary_gap: string;
  reason: string;
  next_best_action: string;
  practice_type: string;
  estimated_minutes: number;
  priority: Priority;
  learning_topics: string[];
  success_metric: string;
}

/** Topic banks used by the deterministic fallback engine, keyed by skill name. */
const TOPIC_BANK: Record<string, string[]> = {
  Coding: ["Arrays", "Strings", "Recursion", "Time Complexity", "Sorting"],
  "Data Structures & Algorithms": [
    "Linked Lists",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Stacks & Queues",
  ],
  Aptitude: [
    "Quantitative Reasoning",
    "Logical Reasoning",
    "Number Series",
    "Time & Work",
    "Probability",
  ],
  Technical: [
    "OOP Principles",
    "DBMS Fundamentals",
    "Operating Systems",
    "Computer Networks",
    "System Design Basics",
  ],
  Communication: [
    "Structured Speaking",
    "Group Discussion",
    "Email Etiquette",
    "Storytelling in Interviews",
  ],
  Interview: [
    "Behavioral Questions",
    "STAR Method",
    "Technical Whiteboarding",
    "Salary Negotiation Basics",
  ],
  Resume: [
    "Quantifying Impact",
    "Project Descriptions",
    "Skills Section",
    "Formatting & ATS",
  ],
  Python: ["Data Types", "Functions", "Pandas Basics", "File Handling"],
  SQL: ["Joins", "Aggregations", "Subqueries", "Window Functions"],
};

const PRACTICE_TYPE_BY_SKILL: Record<string, string> = {
  Coding: "coding_practice",
  "Data Structures & Algorithms": "coding_practice",
  Aptitude: "aptitude_practice",
  Technical: "technical_quiz",
  Communication: "communication_drill",
  Interview: "mock_interview",
  Resume: "resume_review",
  Python: "coding_practice",
  SQL: "coding_practice",
};

function topicsFor(skillName: string): string[] {
  return TOPIC_BANK[skillName] ?? ["Core Fundamentals", "Practice Questions"];
}

function practiceTypeFor(skillName: string): string {
  return PRACTICE_TYPE_BY_SKILL[skillName] ?? "practice_set";
}

function estimatedMinutesFor(priority: Priority): number {
  if (priority === "HIGH") return 30;
  if (priority === "MEDIUM") return 20;
  return 15;
}

function actionSentence(skillName: string, topics: string[]): string {
  const [t1, t2] = topics;
  switch (practiceTypeFor(skillName)) {
    case "coding_practice":
      return `Complete a focused ${skillName} practice session: 5 ${t1} questions, 3 ${t2 ?? "core"} questions, and 1 timed problem.`;
    case "aptitude_practice":
      return `Complete a 15-question aptitude practice set focused on ${t1} and ${t2 ?? "logical reasoning"}.`;
    case "technical_quiz":
      return `Take a technical quiz covering ${t1} and ${t2 ?? "core CS fundamentals"}.`;
    case "communication_drill":
      return `Practice a structured speaking drill on ${t1}, then record and review a 2-minute response.`;
    case "mock_interview":
      return `Complete a mock interview session focused on ${t1} and ${t2 ?? "technical"} questions.`;
    case "resume_review":
      return `Revise your resume's ${t1.toLowerCase()} and re-run the resume analyzer.`;
    default:
      return `Complete a focused practice session on ${skillName}.`;
  }
}

/**
 * Rule-based Next Best Action generator — used whenever the AI provider is
 * unavailable, disabled, or returns an invalid response. Deliberately mirrors
 * the shape the AI is asked to return, so the UI never has to special-case it.
 */
export function buildFallbackRecommendation(
  gaps: SkillGap[],
  targetRoleName: string
): NextBestAction {
  const sorted = [...gaps].sort((a, b) => b.priorityScore - a.priorityScore);
  const primary = sorted[0];
  const secondary = sorted[1];

  if (!primary || primary.gap <= 0.5) {
    return {
      primary_gap: "None",
      secondary_gap: "None",
      reason:
        "All tracked skills currently meet or exceed the target thresholds for your selected role.",
      next_best_action:
        "Maintain your current preparation pace with a light review session, and consider attempting a harder assessment to raise your ceiling further.",
      practice_type: "practice_set",
      estimated_minutes: 15,
      priority: "LOW",
      learning_topics: ["Advanced Practice", "Mock Interviews"],
      success_metric: "Complete one advanced-difficulty assessment this week.",
    };
  }

  const topics = topicsFor(primary.skillName);
  const trendPhrase =
    primary.trend < -2
      ? " and has been declining over your recent assessments"
      : primary.dataPoints === 0
        ? " (based on limited data so far — complete an assessment to refine this)"
        : "";

  return {
    primary_gap: primary.skillName,
    secondary_gap: secondary?.skillName ?? "None",
    reason: `${primary.skillName} is your largest role-weighted skill gap for ${targetRoleName} (currently ${primary.current}% vs a target of ${primary.target}%)${trendPhrase}.`,
    next_best_action: actionSentence(primary.skillName, topics),
    practice_type: practiceTypeFor(primary.skillName),
    estimated_minutes: estimatedMinutesFor(primary.priority),
    priority: primary.priority,
    learning_topics: topics.slice(0, 3),
    success_metric: `Raise ${primary.skillName} from ${primary.current}% toward ${primary.target}% on your next assessment.`,
  };
}
