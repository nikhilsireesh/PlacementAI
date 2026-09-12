// Static mock-interview question bank. Kept in code (not the DB) since it's
// reference content, not student data — easy for faculty/instructors to edit.

export interface InterviewQuestionBankEntry {
  type: "HR" | "TECHNICAL" | "BEHAVIORAL";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question: string;
}

export const INTERVIEW_QUESTION_BANK: InterviewQuestionBankEntry[] = [
  { type: "HR", difficulty: "EASY", question: "Tell me about yourself." },
  { type: "HR", difficulty: "EASY", question: "Why do you want to join our company?" },
  { type: "HR", difficulty: "MEDIUM", question: "What are your greatest strengths and weaknesses?" },
  { type: "HR", difficulty: "MEDIUM", question: "Where do you see yourself in five years?" },
  { type: "HR", difficulty: "HARD", question: "Describe a time you disagreed with a teammate. How did you resolve it?" },

  { type: "BEHAVIORAL", difficulty: "EASY", question: "Describe a project you are proud of and why." },
  { type: "BEHAVIORAL", difficulty: "MEDIUM", question: "Tell me about a time you failed and what you learned." },
  { type: "BEHAVIORAL", difficulty: "MEDIUM", question: "How do you handle working under tight deadlines?" },
  { type: "BEHAVIORAL", difficulty: "HARD", question: "Describe a situation where you had to convince others to adopt your idea." },

  { type: "TECHNICAL", difficulty: "EASY", question: "What is the difference between an array and a linked list?" },
  { type: "TECHNICAL", difficulty: "EASY", question: "Explain the four principles of Object-Oriented Programming." },
  { type: "TECHNICAL", difficulty: "MEDIUM", question: "What is normalization in databases, and why is it useful?" },
  { type: "TECHNICAL", difficulty: "MEDIUM", question: "Explain the difference between a process and a thread." },
  { type: "TECHNICAL", difficulty: "MEDIUM", question: "What is the time complexity of binary search, and why?" },
  { type: "TECHNICAL", difficulty: "HARD", question: "How would you design a URL shortening service at a high level?" },
  { type: "TECHNICAL", difficulty: "HARD", question: "Explain how a hash map works internally and how collisions are handled." },
];

export function pickInterviewQuestions(
  type: "HR" | "TECHNICAL" | "BEHAVIORAL",
  difficulty: "EASY" | "MEDIUM" | "HARD",
  count = 3
): string[] {
  const exact = INTERVIEW_QUESTION_BANK.filter((q) => q.type === type && q.difficulty === difficulty);
  const sameType = INTERVIEW_QUESTION_BANK.filter((q) => q.type === type);
  const pool = exact.length >= count ? exact : sameType;
  return pool.slice(0, count).map((q) => q.question);
}
