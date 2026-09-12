import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.role !== "FACULTY" && session.role !== "ADMIN")) redirect("/login");

  return (
    <AppShell role="faculty" userName={session.name} roleLabel="Faculty">
      {children}
    </AppShell>
  );
}
