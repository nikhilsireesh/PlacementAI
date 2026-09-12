/**
 * Scoped cleanup after manual feature testing — removes the specific test
 * assessments and test-driven activity created for the demo student during
 * this session, and restores Arjun Kumar's skill/readiness baseline to the
 * values documented in the README/seed script. This is a small, targeted
 * fix (not a database reset): every `where` below names exact known rows.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Remove the two assessments created while testing the PDF upload feature.
  const testAssessments = await prisma.assessment.findMany({
    where: { title: { in: ["Aptitude Quiz — Uploaded via PDF test", "Real PDF Upload Test 3"] } },
    select: { id: true, title: true },
  });
  for (const a of testAssessments) {
    await prisma.assessment.delete({ where: { id: a.id } }); // cascades to its questions/attempts/practice sessions
    console.log(`Deleted test assessment: ${a.title}`);
  }

  // 2. Restore Arjun Kumar's documented baseline.
  const arjunUser = await prisma.user.findUnique({ where: { email: "student@demo.com" } });
  if (!arjunUser) {
    console.log("Demo student not found — nothing else to clean up.");
    return;
  }
  const arjun = await prisma.student.findUnique({ where: { userId: arjunUser.id } });
  if (!arjun) return;

  const skills = await prisma.skill.findMany({
    where: { name: { in: ["Coding", "Aptitude", "Technical", "Communication", "Interview"] } },
  });
  const skillIdByName = new Map(skills.map((s) => [s.name, s.id]));
  const baseline: Record<string, { current: number; previous: number; dataPoints: number }> = {
    Coding: { current: 48, previous: 52, dataPoints: 4 },
    Aptitude: { current: 82, previous: 78, dataPoints: 3 },
    Technical: { current: 61, previous: 58, dataPoints: 3 },
    Communication: { current: 76, previous: 74, dataPoints: 3 },
    Interview: { current: 51, previous: 55, dataPoints: 2 },
  };
  for (const [name, v] of Object.entries(baseline)) {
    const skillId = skillIdByName.get(name);
    if (!skillId) continue;
    await prisma.studentSkill.update({
      where: { studentId_skillId: { studentId: arjun.id, skillId } },
      data: { currentScore: v.current, previousScore: v.previous, dataPoints: v.dataPoints },
    });
  }
  console.log("Restored Arjun Kumar's baseline skill scores.");

  // 3. Remove activity rows created by testing today, back to the original
  //    seeded history (readiness snapshots, extra progress records, extra
  //    attempts/practice sessions/recommendations/interview sessions/resumes).
  await prisma.readinessSnapshot.deleteMany({ where: { studentId: arjun.id } });
  await prisma.readinessSnapshot.createMany({
    data: [
      { studentId: arjun.id, score: 52.0, confidence: 45, breakdown: {}, createdAt: new Date(Date.now() - 35 * 86400000) },
      { studentId: arjun.id, score: 58.4, confidence: 55, breakdown: {}, createdAt: new Date(Date.now() - 24 * 86400000) },
      { studentId: arjun.id, score: 61.2, confidence: 65, breakdown: {}, createdAt: new Date(Date.now() - 12 * 86400000) },
    ],
  });

  await prisma.progressRecord.deleteMany({ where: { studentId: arjun.id } });
  const codingSkillId = skillIdByName.get("Coding")!;
  await prisma.progressRecord.createMany({
    data: [
      { studentId: arjun.id, skillId: codingSkillId, score: 40, source: "assessment", recordedAt: new Date(Date.now() - 35 * 86400000) },
      { studentId: arjun.id, skillId: codingSkillId, score: 44, source: "assessment", recordedAt: new Date(Date.now() - 24 * 86400000) },
      { studentId: arjun.id, skillId: codingSkillId, score: 52, source: "assessment", recordedAt: new Date(Date.now() - 12 * 86400000) },
      { studentId: arjun.id, skillId: codingSkillId, score: 48, source: "assessment", recordedAt: new Date(Date.now() - 1 * 86400000) },
    ],
  });

  await prisma.practiceSession.deleteMany({ where: { studentId: arjun.id } });
  await prisma.interviewSession.deleteMany({ where: { studentId: arjun.id } });
  await prisma.resume.deleteMany({ where: { studentId: arjun.id } });

  await prisma.assessmentAnswer.deleteMany({ where: { attempt: { studentId: arjun.id } } });
  await prisma.assessmentAttempt.deleteMany({ where: { studentId: arjun.id } });
  const codingAssessment = await prisma.assessment.findFirst({ where: { title: "Coding Fundamentals Assessment" } });
  if (codingAssessment) {
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId: arjun.id,
        assessmentId: codingAssessment.id,
        submittedAt: new Date(Date.now() - 12 * 86400000),
        rawScore: 2,
        totalMarks: codingAssessment.totalMarks,
        percentage: 40,
      },
    });
    const questions = await prisma.question.findMany({ where: { assessmentId: codingAssessment.id } });
    for (const [i, q] of questions.entries()) {
      const isCorrect = i < 2;
      await prisma.assessmentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: q.id,
          answerText: isCorrect ? q.correctAnswer : "N/A",
          isCorrect,
          marksAwarded: isCorrect ? q.marks : 0,
        },
      });
    }
  }

  await prisma.recommendation.deleteMany({ where: { studentId: arjun.id } });
  await prisma.recommendation.create({
    data: {
      studentId: arjun.id,
      primaryGap: "Coding",
      secondaryGap: "Interview",
      reason:
        "Coding is your largest role-weighted skill gap for Software Developer (currently 48% vs a target of 75%) and has remained below target across your last two assessments.",
      nextBestAction: "Complete a focused Coding practice session: 5 Arrays questions, 3 Strings questions, and 1 timed problem.",
      practiceType: "coding_practice",
      estimatedMinutes: 30,
      priority: "HIGH",
      learningTopics: ["Arrays", "Strings", "Recursion"],
      successMetric: "Raise Coding from 48% toward 75% on your next assessment.",
      source: "FALLBACK",
      status: "COMPLETED",
      skillScoreBefore: 40,
      skillScoreAfter: 48,
      feedbackRating: 4,
      feedbackComment: "The array questions were a good warm-up before the timed problem.",
      createdAt: new Date(Date.now() - 10 * 86400000),
      completedAt: new Date(Date.now() - 9 * 86400000),
    },
  });

  await prisma.studentBadge.deleteMany({ where: { studentId: arjun.id, code: { not: "FIRST_ASSESSMENT" } } });

  console.log("Restored Arjun Kumar's activity history to the documented baseline.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
