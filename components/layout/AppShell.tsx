"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Dumbbell,
  MessageCircleQuestion,
  FileText,
  Mic,
  Map,
  TrendingUp,
  BookOpen,
  UserCircle,
  Users,
  Target,
  FileBarChart,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/apiClient";
import { Logo } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Nav configs live inside this client component (rather than being passed in
// as props from a server layout) because Lucide icon components are
// functions — React Server Components cannot serialize functions across the
// server/client boundary.
const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/student/assessments", icon: ClipboardList },
  { label: "Practice", href: "/student/practice", icon: Dumbbell },
  { label: "AI Coach", href: "/student/coach", icon: MessageCircleQuestion },
  { label: "Resume", href: "/student/resume", icon: FileText },
  { label: "Mock Interview", href: "/student/interview", icon: Mic },
  { label: "Roadmap", href: "/student/roadmap", icon: Map },
  { label: "Progress", href: "/student/progress", icon: TrendingUp },
  { label: "Resources", href: "/student/resources", icon: BookOpen },
  { label: "Profile", href: "/student/profile", icon: UserCircle },
];

const FACULTY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/faculty/students", icon: Users },
  { label: "Skill Gaps", href: "/faculty/skill-gaps", icon: Target },
  { label: "Assessments", href: "/faculty/assessments", icon: ClipboardList },
  { label: "Reports", href: "/faculty/reports", icon: FileBarChart },
  { label: "Job Roles", href: "/faculty/job-roles", icon: Briefcase },
  { label: "Resources", href: "/faculty/resources", icon: BookOpen },
];

function NavLinks({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--muted)] hover:bg-gray-100 hover:text-[var(--foreground)]"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  userName,
  roleLabel,
  children,
}: {
  role: "student" | "faculty";
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const navItems = role === "student" ? STUDENT_NAV : FACULTY_NAV;
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await apiPost("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-[var(--border)] bg-white py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-4 font-semibold text-[var(--foreground)]">
          <Logo size={32} />
          Placement Readiness
        </div>
        <NavLinks navItems={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        <div className="mt-auto border-t border-[var(--border)] px-4 pt-4">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">{userName}</p>
          <p className="text-xs text-[var(--muted)]">{roleLabel}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--danger)]"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
          <Logo size={28} />
          Placement Readiness
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6 text-[var(--foreground)]" />
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-4">
              <div className="flex items-center gap-2.5 font-semibold text-[var(--foreground)]">
                <Logo size={32} />
                Menu
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks navItems={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-[var(--border)] px-4 pt-4">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">{userName}</p>
              <p className="text-xs text-[var(--muted)]">{roleLabel}</p>
              <button
                onClick={handleLogout}
                className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--danger)]"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 pb-16 pt-20 lg:px-8 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
