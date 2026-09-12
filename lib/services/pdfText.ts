/** Shared PDF -> plain text extraction, used by both the resume analyzer
 * and the faculty question-bank uploader. */
export class PdfExtractionError extends Error {}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Loaded dynamically so a broken/missing native dep never crashes the caller.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text;
  } catch (err) {
    console.warn("[pdfText] extraction failed:", err instanceof Error ? err.message : err);
    throw new PdfExtractionError("We couldn't read that PDF file.");
  }
}
