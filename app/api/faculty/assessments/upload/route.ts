import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import { extractPdfText, PdfExtractionError } from "@/lib/services/pdfText";
import { parseQuestionsFromPdf } from "@/lib/ai/aiService";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_TEXT_LENGTH = 40_000;

const metaSchema = z.object({
  title: z.string().min(3).max(150),
  skillId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  isPractice: z.enum(["true", "false"]).transform((v) => v === "true"),
  timeLimitMinutes: z.coerce.number().int().min(5).max(180).default(20),
  topic: z.string().max(80).optional(),
});

async function extractText(file: File | null, pastedText: string | null): Promise<string> {
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) throw new ApiError(413, "File is too large (max 8MB).");
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      try {
        return await extractPdfText(buffer);
      } catch (err) {
        if (err instanceof PdfExtractionError) {
          throw new ApiError(
            422,
            "We couldn't read that PDF. Try exporting it as plain text, or paste the questions directly."
          );
        }
        throw err;
      }
    }
    return buffer.toString("utf-8");
  }
  if (pastedText && pastedText.trim().length > 0) return pastedText;
  throw new ApiError(400, "Upload a PDF file or paste the questions as text.");
}

export const POST = withErrorHandling(async (req: Request) => {
  await requireSession(["FACULTY", "ADMIN"]);

  const form = await req.formData();
  const meta = metaSchema.parse({
    title: form.get("title"),
    skillId: form.get("skillId"),
    difficulty: form.get("difficulty") ?? undefined,
    isPractice: form.get("isPractice") ?? "false",
    timeLimitMinutes: form.get("timeLimitMinutes") ?? undefined,
    topic: form.get("topic") || undefined,
  });

  const file = form.get("file");
  const pastedText = form.get("text");
  let text = await extractText(
    file instanceof File ? file : null,
    typeof pastedText === "string" ? pastedText : null
  );
  text = text.trim().slice(0, MAX_TEXT_LENGTH);
  if (text.length < 20) {
    throw new ApiError(422, "That file/text looks too short to contain any questions.");
  }

  const skill = await prisma.skill.findUnique({ where: { id: meta.skillId } });
  if (!skill) throw new ApiError(400, "Invalid skill selected.");

  const { source, data } = await parseQuestionsFromPdf(text);

  if (data.questions.length === 0) {
    throw new ApiError(
      422,
      "No valid questions could be parsed. Check the format in the instructions and try again."
    );
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: meta.title,
      category: skill.category,
      skillId: skill.id,
      difficulty: meta.difficulty,
      timeLimitMinutes: meta.isPractice ? 15 : meta.timeLimitMinutes,
      totalMarks: data.questions.length,
      isPractice: meta.isPractice,
      topic: meta.topic,
      questions: {
        create: data.questions.map((q) => ({
          skillId: skill.id,
          type: "MCQ",
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          marks: 1,
          difficulty: meta.difficulty,
          topic: meta.topic,
        })),
      },
    },
    include: { _count: { select: { questions: true } } },
  });

  return NextResponse.json({
    assessmentId: assessment.id,
    title: assessment.title,
    isPractice: assessment.isPractice,
    source,
    questionsCreated: assessment._count.questions,
    warnings: data.warnings,
  });
});
