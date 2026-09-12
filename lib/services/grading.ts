import type { Question } from "@prisma/client";

export interface GradedAnswer {
  questionId: string;
  answerText: string;
  isCorrect: boolean;
  marksAwarded: number;
  correctAnswer: string;
  explanation: string | null;
}

export interface GradingResult {
  rawScore: number;
  totalMarks: number;
  percentage: number;
  answers: GradedAnswer[];
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/** Grades MCQ / code-output style questions by exact (case-insensitive) match.
 * Descriptive questions are not auto-graded in this MVP — see README limitations. */
export function gradeAnswers(
  questions: Question[],
  submitted: { questionId: string; answerText: string }[]
): GradingResult {
  const questionsById = new Map(questions.map((q) => [q.id, q]));
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  let rawScore = 0;
  const answers: GradedAnswer[] = [];

  for (const s of submitted) {
    const question = questionsById.get(s.questionId);
    if (!question) continue;
    const isCorrect =
      question.type !== "DESCRIPTIVE" && normalize(s.answerText) === normalize(question.correctAnswer);
    const marksAwarded = isCorrect ? question.marks : 0;
    rawScore += marksAwarded;
    answers.push({
      questionId: question.id,
      answerText: s.answerText,
      isCorrect,
      marksAwarded,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
  }

  const percentage = totalMarks > 0 ? Math.round((rawScore / totalMarks) * 1000) / 10 : 0;

  return { rawScore, totalMarks, percentage, answers };
}
