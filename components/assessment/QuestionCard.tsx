import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface QuestionDto {
  id: string;
  type: "MCQ" | "CODE_OUTPUT" | "DESCRIPTIVE";
  text: string;
  options?: string[] | null;
  marks: number;
  topic?: string | null;
}

export function QuestionCard({
  question,
  index,
  value,
  onChange,
  review,
}: {
  question: QuestionDto;
  index: number;
  value: string;
  onChange: (v: string) => void;
  review?: { isCorrect: boolean; correctAnswer: string; explanation: string | null } | null;
}) {
  return (
    <div className="surface-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-medium text-[var(--foreground)]">
          {index + 1}. {question.text}
        </p>
        <span className="shrink-0 text-xs text-[var(--muted)]">{question.marks} pt</span>
      </div>

      {question.type === "MCQ" && Array.isArray(question.options) ? (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const selected = value === opt;
            const showCorrect = review && opt === review.correctAnswer;
            const showWrong = review && selected && !review.isCorrect;
            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  selected ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] hover:bg-gray-50",
                  showCorrect && "border-[var(--success)] bg-[var(--success-soft)]",
                  showWrong && "border-[var(--danger)] bg-[var(--danger-soft)]"
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={selected}
                  onChange={() => onChange(opt)}
                  disabled={!!review}
                  className="accent-[var(--primary)]"
                />
                {opt}
              </label>
            );
          })}
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!!review}
          placeholder="Type your answer…"
        />
      )}

      {review && (
        <p className={cn("mt-3 text-sm", review.isCorrect ? "text-[var(--success)]" : "text-[var(--danger)]")}>
          {review.isCorrect ? "Correct. " : `Correct answer: ${review.correctAnswer}. `}
          {review.explanation}
        </p>
      )}
    </div>
  );
}
