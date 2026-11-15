import type { NextConfig } from "next";

const config: NextConfig = {
  // Les références IA du catalogue sont lues sur disque par l'API de rendu.
  outputFileTracingIncludes: {
    "/api/render": ["./public/catalogue/**/ref*.jpg"],
  },
  images: { formats: ["image/avif", "image/webp"] },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default config;
