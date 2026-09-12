"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiPut, ClientApiError } from "@/lib/apiClient";

interface WeightRow {
  skillId: string;
  skillName: string;
  weight: number;
  minimumTarget: number;
}

export function WeightEditor({
  jobRoleId,
  initialWeights,
  availableSkills,
}: {
  jobRoleId: string;
  initialWeights: WeightRow[];
  availableSkills: { skillId: string; skillName: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [weights, setWeights] = useState<WeightRow[]>(initialWeights);
  const [addingSkillId, setAddingSkillId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  const remaining = availableSkills.filter((s) => !weights.some((w) => w.skillId === s.skillId));

  function update(skillId: string, field: "weight" | "minimumTarget", value: number) {
    setWeights((prev) => prev.map((w) => (w.skillId === skillId ? { ...w, [field]: value } : w)));
  }

  function remove(skillId: string) {
    setWeights((prev) => prev.filter((w) => w.skillId !== skillId));
  }

  function addSkill() {
    const skill = remaining.find((s) => s.skillId === addingSkillId);
    if (!skill) return;
    setWeights((prev) => [...prev, { skillId: skill.skillId, skillName: skill.skillName, weight: 0.1, minimumTarget: 70 }]);
    setAddingSkillId("");
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await apiPut(`/api/faculty/job-roles/${jobRoleId}/skills`, {
        weights: weights.map((w) => ({ skillId: w.skillId, weight: w.weight, minimumTarget: w.minimumTarget })),
      });
      push({ title: "Weights updated", description: "Readiness scores for this role will use the new weights.", tone: "success" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to save weights.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
              <th className="px-3 py-2">Skill</th>
              <th className="px-3 py-2">Weight (%)</th>
              <th className="px-3 py-2">Target Score</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {weights.map((w) => (
              <tr key={w.skillId} className="border-b border-[var(--border)] last:border-0">
                <td className="px-3 py-2 font-medium text-[var(--foreground)]">{w.skillName}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(w.weight * 100)}
                    onChange={(e) => update(w.skillId, "weight", Number(e.target.value) / 100)}
                    className="w-24"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={w.minimumTarget}
                    onChange={(e) => update(w.skillId, "minimumTarget", Number(e.target.value))}
                    className="w-24"
                  />
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => remove(w.skillId)} aria-label={`Remove ${w.skillName}`}>
                    <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`text-sm font-medium ${Math.abs(total - 1) > 0.1 ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
        Total weight: {Math.round(total * 100)}% {Math.abs(total - 1) > 0.1 && "(should be ~100%)"}
      </p>

      {remaining.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={addingSkillId} onChange={(e) => setAddingSkillId(e.target.value)} className="max-w-xs">
            <option value="">Add a skill…</option>
            {remaining.map((s) => (
              <option key={s.skillId} value={s.skillId}>
                {s.skillName}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="sm" onClick={addSkill} disabled={!addingSkillId}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : "Save Weights"}
      </Button>
    </div>
  );
}
