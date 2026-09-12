import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.profileId) redirect("/login");

  const [student, departments, jobRoles] = await Promise.all([
    prisma.student.findUnique({ where: { id: session.profileId }, include: { user: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.jobRole.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!student) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Your Profile</h1>
        <p className="text-[var(--muted)]">Keep this up to date so your readiness score stays accurate.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <ProfileForm
          student={{
            rollNumber: student.rollNumber,
            email: student.user.email,
            departmentId: student.departmentId,
            year: student.year,
            semester: student.semester,
            cgpa: student.cgpa,
            preferredRoleId: student.preferredRoleId,
            profileCompletion: student.profileCompletion,
          }}
          departments={departments}
          jobRoles={jobRoles}
        />
      </Card>
    </div>
  );
}
