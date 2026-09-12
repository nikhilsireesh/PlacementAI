import { colorForScore } from "@/components/ui/Progress";

export interface SkillBarDatum {
  skillName: string;
  score: number;
  target?: number;
}

export function SkillBars({ skills }: { skills: SkillBarDatum[] }) {
  return (
    <div className="space-y-4">
      {skills.map((s) => (
        <div key={s.skillName}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium text-[var(--foreground)]">{s.skillName}</span>
            <span className="text-[var(--muted)]">
              {Math.round(s.score)}%{s.target != null && <> · target {s.target}%</>}
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colorForScore(s.score)}`}
              style={{ width: `${Math.max(0, Math.min(100, s.score))}%` }}
            />
            {s.target != null && (
              <div
                className="absolute top-0 h-full w-0.5 bg-gray-400"
                style={{ left: `${Math.max(0, Math.min(100, s.target))}%` }}
                title={`Target: ${s.target}%`}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
