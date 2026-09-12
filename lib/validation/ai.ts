import { z } from "zod";

// Every schema here validates AI output before it is trusted or shown to a
// user. If validation fails for any reason, callers fall back to the
// deterministic engine — the app never blindly trusts model output.

export const recommendationSchema = z.object({
  primary_gap: z.string().min(1).max(80),
  secondary_gap: z.string().min(1).max(80),
  reason: z.string().min(1).max(500),
  next_best_action: z.string().min(1).max(500),
  practice_type: z.string().min(1).max(60),
  estimated_minutes: z.number().int().min(5).max(180),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  learning_topics: z.array(z.string().min(1).max(60)).min(1).max(6),
  success_metric: z.string().min(1).max(300),
});
export type RecommendationOutput = z.infer<typeof recommendationSchema>;

export const resumeAnalysisSchema = z.object({
  detected_skills: z.array(z.string()).max(30),
  detected_projects: z.array(z.string()).max(15),
  role_alignment_summary: z.string().min(1).max(600),
  missing_skills: z.array(z.string()).max(15),
  strengths: z.array(z.string()).max(10),
  improvement_suggestions: z.array(z.string()).max(10),
  overall_feedback: z.string().min(1).max(600),
});
export type ResumeAnalysisOutput = z.infer<typeof resumeAnalysisSchema>;

export const interviewAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(8),
  areas_to_improve: z.array(z.string()).max(8),
  missing_points: z.array(z.string()).max(8),
  next_action: z.string().min(1).max(300),
});
export type InterviewAnalysisOutput = z.infer<typeof interviewAnalysisSchema>;

export const roadmapDaySchema = z.object({
  day: z.number().int().min(1).max(30),
  focus: z.string().min(1).max(120),
  tasks: z.array(z.string()).min(1).max(6),
  estimated_minutes: z.number().int().min(10).max(240),
});

export const roadmapSchema = z.object({
  days: z.array(roadmapDaySchema).min(1).max(30),
});
export type RoadmapOutput = z.infer<typeof roadmapSchema>;

export const coachAnswerSchema = z.object({
  answer: z.string().min(1).max(1200),
});
export type CoachAnswerOutput = z.infer<typeof coachAnswerSchema>;

export const facultyInsightSchema = z.object({
  summary: z.string().min(1).max(600),
  suggested_intervention: z.string().min(1).max(400),
});
export type FacultyInsightOutput = z.infer<typeof facultyInsightSchema>;

export const parsedQuestionSchema = z.object({
  text: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(300)).min(2).max(6),
  correctAnswer: z.string().min(1).max(300),
  explanation: z.string().max(500).optional(),
});

export const parsedQuestionsSchema = z.object({
  questions: z.array(parsedQuestionSchema).min(1).max(100),
});
export type ParsedQuestionsOutput = z.infer<typeof parsedQuestionsSchema>;
