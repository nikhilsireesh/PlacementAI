import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  colorClassName = "bg-[var(--primary)]",
  trackClassName = "bg-gray-100",
}: {
  value: number;
  className?: string;
  colorClassName?: string;
  trackClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full", trackClassName, className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Color-codes a score bar so status isn't communicated by color alone —
 * pair this with a text label in the surrounding component. */
export function colorForScore(score: number): string {
  if (score >= 75) return "bg-[var(--success)]";
  if (score >= 60) return "bg-[var(--warning)]";
  return "bg-[var(--danger)]";
}
