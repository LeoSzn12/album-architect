import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a plain static site (GitHub Pages) with no server
// routes; the game falls back to on-device play. The Cloudflare Worker build
// (vinext) ignores these settings.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = staticExport
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      ...(basePath ? { basePath, assetPrefix: basePath } : {}),
    }
  : {};

export default nextConfig;
