import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Raise the EventEmitter listener cap to avoid the dev-mode warning that fires
// because reactStrictMode doubles useEffect calls, and each proxied /api request
// adds a "close" listener to the Node.js HTTP socket (default cap is 10).
process.setMaxListeners(25);

// Backend origin to proxy /api requests to. Override via env on Vercel if it changes.
const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://46.249.98.55:3000";
const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: configDir,
  },
  // Proxy /api/* to the backend server-side so the HTTPS frontend can talk to the
  // HTTP backend without mixed-content/CORS issues. Set NEXT_PUBLIC_API_URL=/api.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
