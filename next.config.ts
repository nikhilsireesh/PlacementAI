import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) spins up a worker at runtime whose file path
  // doesn't resolve correctly once bundled by Turbopack. Marking it external
  // makes Next.js load it with a plain Node `require` instead, where the
  // worker resolves normally.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
