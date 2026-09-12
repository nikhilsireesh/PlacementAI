import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) spins up a worker at runtime whose file path
  // doesn't resolve correctly once bundled by Turbopack. Marking it external
  // makes Next.js load it with a plain Node `require` instead, where the
  // worker resolves normally.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // pdfjs-dist dynamically imports its own worker file
  // (pdf.worker.mjs) at runtime — Vercel's static file tracer can't see
  // that, so the worker never gets included in the deployed function
  // unless we say so explicitly here.
  outputFileTracingIncludes: {
    "/api/resume/analyze": ["./node_modules/pdfjs-dist/legacy/build/*"],
    "/api/faculty/assessments/upload": ["./node_modules/pdfjs-dist/legacy/build/*"],
  },
};

export default nextConfig;
