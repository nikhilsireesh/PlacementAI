import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  return (
    <AppShell role="student" userName={session.name} roleLabel="Student">
      {children}
    </AppShell>
  );
}
