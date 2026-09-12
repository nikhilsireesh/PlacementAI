"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";
import { AuthBackground } from "@/components/layout/AuthBackground";
import { apiPost, ClientApiError } from "@/lib/apiClient";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleHint = searchParams.get("role");
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState(roleHint === "faculty" ? "faculty@demo.com" : "student@demo.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await apiPost<{ user: { role: string } }>("/api/auth/login", { email, password });
      const destination =
        nextPath ?? (user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground>
      <Card className="w-full shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={44} className="mb-3" />
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Welcome back</h1>
          <p className="text-sm text-[var(--muted)]">Sign in to your placement readiness account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-5 rounded-lg bg-gray-50 p-3 text-xs text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)]">Demo accounts</p>
          <p>Student: student@demo.com / student123</p>
          <p>Faculty: faculty@demo.com / faculty123</p>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          New student?{" "}
          <Link href="/register" className="font-medium text-[var(--primary)]">
            Create an account
          </Link>
        </p>
      </Card>
    </AuthBackground>
  );
}
