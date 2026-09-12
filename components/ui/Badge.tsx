import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral" | "secondary";

const toneClasses: Record<Tone, string> = {
  primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
  secondary: "bg-[var(--secondary-soft)] text-[var(--secondary)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  neutral: "bg-gray-100 text-gray-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

/** Maps a readiness level to a badge tone, keeping this mapping in one place. */
export function toneForReadinessLevel(level: string): Tone {
  switch (level) {
    case "EXCELLENT":
    case "PLACEMENT_READY":
      return "success";
    case "NEEDS_IMPROVEMENT":
      return "warning";
    case "AT_RISK":
    case "CRITICAL_GAP":
      return "danger";
    default:
      return "neutral";
  }
}

export function toneForPriority(priority: string): Tone {
  if (priority === "HIGH") return "danger";
  if (priority === "MEDIUM") return "warning";
  return "neutral";
}
