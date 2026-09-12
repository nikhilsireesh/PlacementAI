"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "error" | "info";
}

interface ToastContextValue {
  push: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "surface-card pointer-events-auto flex items-start gap-3 p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2"
            )}
          >
            {t.tone === "success" && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />}
            {t.tone === "error" && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />}
            {t.tone === "info" && <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />}
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)]">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-[var(--muted)]">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
