const LEVEL_COLOR: Record<string, string> = {
  EXCELLENT: "var(--success)",
  PLACEMENT_READY: "var(--success)",
  NEEDS_IMPROVEMENT: "var(--warning)",
  AT_RISK: "var(--danger)",
  CRITICAL_GAP: "var(--danger)",
};

export function ReadinessGauge({
  score,
  levelLabel,
  level,
  size = 160,
}: {
  score: number;
  levelLabel: string;
  level: string;
  size?: number;
}) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = LEVEL_COLOR[level] ?? "var(--primary)";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={12} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-[var(--foreground)]">{clamped}</span>
          <span className="text-xs text-[var(--muted)]">/ 100</span>
        </div>
      </div>
      <span
        className="inline-block rounded-full px-3 py-1 text-sm font-medium"
        style={{ background: `color-mix(in srgb, ${color} 15%, white)`, color }}
      >
        {levelLabel}
      </span>
    </div>
  );
}
