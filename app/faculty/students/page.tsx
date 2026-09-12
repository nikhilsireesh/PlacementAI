import { Suspense } from "react";
import { FacultyStudentsClient } from "./FacultyStudentsClient";

export default function FacultyStudentsPage() {
  return (
    <Suspense>
      <FacultyStudentsClient />
    </Suspense>
  );
}
