/** Shared PDF -> plain text extraction, used by both the resume analyzer
 * and the faculty question-bank uploader. */
export class PdfExtractionError extends Error {}

/**
 * pdfjs-dist (used internally by pdf-parse) evaluates `new DOMMatrix()` at
 * module load time regardless of whether anything is actually rendered —
 * so on any Node.js runtime without a browser DOM (including Vercel's
 * serverless functions), just extracting plain text throws
 * "DOMMatrix is not defined" unless something provides it first.
 *
 * pdfjs-dist's own fallback is to `require("@napi-rs/canvas")`, a native
 * binary package — fragile in serverless (platform-specific binaries can
 * go missing from a deployment's file trace). A pure-JS polyfill sidesteps
 * that failure mode entirely; it's only needed for module-level matrix
 * setup, not for anything text-extraction actually uses.
 */
async function ensureDomMatrixPolyfill() {
  if (typeof globalThis.DOMMatrix !== "undefined") return;
  const DOMMatrixPolyfill = (await import("dommatrix")).default;
  // Intentionally polyfilling a browser global for pdfjs-dist's Node.js code path.
  globalThis.DOMMatrix = DOMMatrixPolyfill as unknown as typeof DOMMatrix;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    await ensureDomMatrixPolyfill();
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
