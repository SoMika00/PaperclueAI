import type { NextConfig } from "next";

/**
 * The research backend (FastAPI, from SoMika00/PaperclueAI) is reached
 * through a server-side rewrite so the browser stays same-origin (no CORS).
 * Override BACKEND_API_URL for a local `docker compose up` backend
 * (http://localhost:8000/api).
 */
const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "https://mymirror.fr/paperclue/api";

const nextConfig: NextConfig = {
  // Next.js dev mode blocks cross-origin requests to dev assets/endpoints
  // by default. Temporary tunnel domains (for sharing a local dev build)
  // need to be allow-listed here, or every asset/API request through the
  // tunnel gets silently blocked.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
    "*.trycloudflare.com",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
