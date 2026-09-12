"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label, Select, Input, FieldError } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { apiPatch, ClientApiError } from "@/lib/apiClient";

interface Option {
  id: string;
  name: string;
}

export function ProfileForm({
  student,
  departments,
  jobRoles,
}: {
  student: {
    rollNumber: string;
    email: string;
    departmentId: string;
    year: number;
    semester: number;
    cgpa: number | null;
    preferredRoleId: string | null;
    profileCompletion: number;
  };
  departments: Option[];
  jobRoles: Option[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [form, setForm] = useState({
    departmentId: student.departmentId,
    year: student.year,
    cgpa: student.cgpa ?? 7.5,
    preferredRoleId: student.preferredRoleId ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiPatch("/api/student/profile", {
        departmentId: form.departmentId,
        year: Number(form.year),
        cgpa: Number(form.cgpa),
        preferredRoleId: form.preferredRoleId || undefined,
      });
      push({ title: "Profile updated", tone: "success" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-1 flex justify-between text-sm">
          <span className="font-medium text-[var(--foreground)]">Profile completion</span>
          <span className="text-[var(--muted)]">{student.profileCompletion}%</span>
        </p>
        <ProgressBar value={student.profileCompletion} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Email</Label>
          <Input value={student.email} disabled />
        </div>
        <div>
          <Label>Roll number</Label>
          <Input value={student.rollNumber} disabled />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Select
            id="department"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <Select id="year" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cgpa">CGPA</Label>
          <Input
            id="cgpa"
            type="number"
            step="0.1"
            min={0}
            max={10}
            value={form.cgpa}
            onChange={(e) => setForm({ ...form, cgpa: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="role">Target job role</Label>
          <Select
            id="role"
            value={form.preferredRoleId}
            onChange={(e) => setForm({ ...form, preferredRoleId: e.target.value })}
          >
            <option value="">Select a role…</option>
            {jobRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={saving}>
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
