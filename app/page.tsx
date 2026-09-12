import Link from "next/link";
import Image from "next/image";
import {
  Gauge,
  Target,
  MessageCircleQuestion,
  Map,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session?.role === "STUDENT") redirect("/student/dashboard");
  if (session?.role === "FACULTY" || session?.role === "ADMIN") redirect("/faculty/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5 font-semibold text-[var(--foreground)]">
            <Logo size={32} />
            Placement Readiness
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero — the college's own campus as the backdrop, with a dark
            wash so the white hero text stays legible at every width. */}
        <section className="relative overflow-hidden">
          <Image
            src="/campus-building.jpg"
            alt="College campus building"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1030]/85 via-[#161a45]/80 to-[var(--background)]" />

          <div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur">
              <Target className="h-4 w-4" /> The Next Best Action Engine
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Prepare Smarter. <span className="text-indigo-300">Get Placement Ready.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
              An AI-powered placement readiness platform that identifies your skill gaps and tells
              you exactly what to do next — then reassesses and updates as you improve.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg">
                  Start Preparing <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login?role=faculty">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15">
                  Faculty Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-5 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Gauge,
              title: "Readiness Score",
              desc: "A transparent, explainable score computed from your real skill data — weighted for your target role.",
            },
            {
              icon: Target,
              title: "Skill Gap Analysis",
              desc: "See exactly which skills are holding you back, ranked by role-weighted priority.",
            },
            {
              icon: MessageCircleQuestion,
              title: "AI Coach",
              desc: "Ask specific questions and get answers grounded in your actual assessment data.",
            },
            {
              icon: Map,
              title: "Personalized Roadmap",
              desc: "A day-by-day preparation plan that adapts as your performance changes.",
            },
          ].map((f) => (
            <div key={f.title} className="surface-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary-soft)]">
                <f.icon className="h-5 w-5 text-[var(--secondary)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="surface-card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-[var(--success)]" />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Built for a college placement cell</h3>
                <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
                  Deterministic scoring you can explain, AI that assists rather than judges, and
                  role-based access so every student&apos;s data stays private.
                </p>
              </div>
            </div>
            <Link href="/register">
              <Button variant="secondary">Create a student account</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted)]">
        Demo accounts: student@demo.com / student123 &middot; faculty@demo.com / faculty123
      </footer>
    </div>
  );
}
