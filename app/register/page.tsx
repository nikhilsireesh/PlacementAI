"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";
import { AuthBackground } from "@/components/layout/AuthBackground";
import { apiFetch, apiPost, ClientApiError } from "@/lib/apiClient";

interface Department {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    departmentId: "",
    year: "1",
    semester: "1",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ departments: Department[] }>("/api/departments")
      .then((res) => {
        setDepartments(res.departments);
        if (res.departments[0]) setForm((f) => ({ ...f, departmentId: res.departments[0].id }));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPost("/api/auth/register", {
        ...form,
        year: Number(form.year),
        semester: Number(form.semester),
      });
      router.push("/student/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground maxWidthClassName="max-w-md">
      <Card className="w-full shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={44} className="mb-3" />
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Create your student account</h1>
          <p className="text-sm text-[var(--muted)]">Start tracking your placement readiness</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="rollNumber">Roll number</Label>
            <Input
              id="rollNumber"
              required
              value={form.rollNumber}
              onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
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
              <Select id="year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select id="semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" className="w-full" disabled={loading}>
            <UserPlus className="h-4 w-4" />
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--primary)]">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthBackground>
  );
}
