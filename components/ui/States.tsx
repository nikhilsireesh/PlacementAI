import type { LucideIcon } from "lucide-react";
import { Inbox, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-center", className)}>
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)]">
        <Icon className="h-6 w-6 text-[var(--primary)]" />
      </div>
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--muted)]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-[var(--danger)]" />
      <p className="text-sm text-[var(--danger)]">{message}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--muted)]">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} />;
}
