/**
 * Concrete, resume-checkable keywords per job role — used by the resume
 * analyzer instead of the abstract skill *category* names (e.g. "Coding",
 * "Technical") that the readiness engine uses. A resume would never contain
 * the literal word "Technical", so checking for it produces meaningless
 * "missing skill" feedback; these lists are what a recruiter would actually
 * scan a resume for.
 */
export const ROLE_RESUME_KEYWORDS: Record<string, string[]> = {
  "Software Developer": ["Data Structures", "Algorithms", "Java", "Python", "C++", "OOP", "Git", "REST API", "System Design"],
  "Data Analyst": ["Python", "SQL", "Pandas", "Excel", "Power BI", "Tableau", "Statistics", "Data Visualization"],
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Responsive Design", "Git"],
  "QA Engineer": ["Test Cases", "Selenium", "Manual Testing", "Automation", "Bug Tracking", "API Testing", "Regression Testing"],
  "Backend Developer": ["Java", "Node.js", "Python", "REST API", "SQL", "Databases", "System Design", "Git"],
  HR: ["Recruitment", "Onboarding", "Communication", "MS Office", "Employee Engagement", "HRIS"],
};

export function resumeKeywordsForRole(roleName: string): string[] {
  return ROLE_RESUME_KEYWORDS[roleName] ?? ["Communication", "Teamwork", "Problem Solving"];
}
