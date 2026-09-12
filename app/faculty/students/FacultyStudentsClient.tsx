"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select, Label } from "@/components/ui/Input";
import { Badge, toneForReadinessLevel, toneForPriority } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { apiFetch } from "@/lib/apiClient";

interface StudentRow {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  departmentName: string;
  year: number;
  targetRole: string | null;
  readiness: number | null;
  level: string | null;
  primaryGap: string | null;
  primaryGapPriority: string | null;
}

interface Option {
  id: string;
  name: string;
}

const LEVEL_TO_KEY: Record<string, string> = {
  Excellent: "EXCELLENT",
  "Placement Ready": "PLACEMENT_READY",
  "Needs Improvement": "NEEDS_IMPROVEMENT",
  "At Risk": "AT_RISK",
  "Critical Gap": "CRITICAL_GAP",
};

export function FacultyStudentsClient() {
  const searchParams = useSearchParams();
  const [departments, setDepartments] = useState<Option[]>([]);
  const [jobRoles, setJobRoles] = useState<Option[]>([]);
  const [skills, setSkills] = useState<Option[]>([]);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    departmentId: "",
    year: "",
    jobRole: "",
    skill: searchParams.get("skill") ?? "",
    priority: "",
  });

  useEffect(() => {
    Promise.all([
      apiFetch<{ departments: Option[] }>("/api/departments"),
      apiFetch<{ jobRoles: Option[] }>("/api/faculty/job-roles"),
      apiFetch<{ skills: Option[] }>("/api/skills"),
    ]).then(([d, r, s]) => {
      setDepartments(d.departments);
      setJobRoles(r.jobRoles);
      setSkills(s.skills);
    });
  }, []);

  useEffect(() => {
    // Standard fetch-on-filter-change pattern: show a spinner immediately,
    // then load the filtered result. The rule below flags this as a
    // synchronous setState in an effect, but it's an intentional loading
    // indicator, not an accidental cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.departmentId) params.set("departmentId", filters.departmentId);
    if (filters.year) params.set("year", filters.year);
    if (filters.jobRole) params.set("jobRole", filters.jobRole);
    if (filters.skill) params.set("skill", filters.skill);
    if (filters.priority) params.set("priority", filters.priority);

    apiFetch<{ students: StudentRow[] }>(`/api/faculty/students?${params.toString()}`)
      .then((res) => setRows(res.students))
      .finally(() => setLoading(false));
  }, [filters]);

  const needsSupportCount = useMemo(() => rows.filter((r) => (r.readiness ?? 100) < 60).length, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Students</h1>
        <p className="text-[var(--muted)]">
          {rows.length} students shown · {needsSupportCount} may need additional support
        </p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>Department</Label>
            <Select value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
              <option value="">All</option>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Job Role</Label>
            <Select value={filters.jobRole} onChange={(e) => setFilters({ ...filters, jobRole: e.target.value })}>
              <option value="">All</option>
              {jobRoles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Primary Gap Skill</Label>
            <Select value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })}>
              <option value="">All</option>
              {skills.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        {loading ? (
          <div className="p-8">
            <LoadingState />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No students match these filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--muted)]">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Target Role</th>
                  <th className="px-4 py-3">Main Gap</th>
                  <th className="px-4 py-3">Readiness</th>
                  <th className="px-4 py-3">Priority</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.studentId} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/faculty/students/${r.studentId}`} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                        {r.name}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">{r.rollNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {r.departmentName} · Y{r.year}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{r.targetRole ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{r.primaryGap ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.readiness != null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)]">{r.readiness}</span>
                          <Badge tone={toneForReadinessLevel(LEVEL_TO_KEY[r.level ?? ""] ?? "")}>{r.level}</Badge>
                        </div>
                      ) : (
                        <span className="text-[var(--muted)]">No target role</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.primaryGapPriority ? (
                        <Badge tone={toneForPriority(r.primaryGapPriority)}>{r.primaryGapPriority}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
