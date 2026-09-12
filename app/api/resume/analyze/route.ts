import { NextResponse } from "next/server";
import { requireSession, withErrorHandling, ApiError } from "@/lib/apiUtils";
import { prisma } from "@/lib/prisma";
import { analyzeResume } from "@/lib/ai/aiService";
import { resumeKeywordsForRole } from "@/lib/data/roleKeywords";
import { extractPdfText, PdfExtractionError } from "@/lib/services/pdfText";

const MAX_TEXT_LENGTH = 20_000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      return await extractPdfText(buffer);
    } catch (err) {
      if (err instanceof PdfExtractionError) {
        throw new ApiError(
          422,
          "We couldn't read that PDF. Try exporting it as plain text, or paste your resume text directly."
        );
      }
      throw err;
    }
  }

  // Treat anything else (.txt, .md, unknown) as plain text.
  return buffer.toString("utf-8");
}

export const POST = withErrorHandling(async (req: Request) => {
  const session = await requireSession(["STUDENT"]);
  if (!session.profileId) throw new ApiError(404, "Student profile not found.");

  const student = await prisma.student.findUnique({
    where: { id: session.profileId },
    include: { preferredRole: true },
  });
  if (!student) throw new ApiError(404, "Student profile not found.");

  const contentType = req.headers.get("content-type") || "";
  let resumeText = "";
  let fileName = "pasted-text.txt";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const pastedText = form.get("text");

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) throw new ApiError(413, "File is too large (max 5MB).");
      fileName = file.name;
      resumeText = await extractText(file);
    } else if (typeof pastedText === "string" && pastedText.trim().length > 0) {
      resumeText = pastedText;
    } else {
      throw new ApiError(400, "Upload a resume file or paste resume text.");
    }
  } else {
    const body = await req.json().catch(() => null);
    if (!body?.text || typeof body.text !== "string") {
      throw new ApiError(400, "Provide resume text in the 'text' field.");
    }
    resumeText = body.text;
  }

  resumeText = resumeText.trim().slice(0, MAX_TEXT_LENGTH);
  if (resumeText.length < 30) {
    throw new ApiError(422, "That resume text looks too short to analyze meaningfully.");
  }

  const targetRoleName = student.preferredRole?.name ?? "General";
  // Use concrete, resume-checkable keywords (e.g. "React", "SQL") rather than
  // the readiness engine's abstract skill categories ("Coding", "Technical")
  // — a resume would never literally contain the word "Technical".
  const targetSkillNames = resumeKeywordsForRole(targetRoleName);

  const { source, data } = await analyzeResume(resumeText, targetRoleName, targetSkillNames);

  const resume = await prisma.resume.create({
    data: {
      studentId: student.id,
      fileName,
      rawText: resumeText,
      analysisJson: { ...data, source } as unknown as object,
    },
  });

  return NextResponse.json({ resumeId: resume.id, source, analysis: data });
});
