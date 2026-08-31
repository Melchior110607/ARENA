import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory. Without it, Turbopack walks up and
  // picks a lockfile outside the repository.
  turbopack: {
    root: path.resolve(process.cwd()),
  },

  // Produces a self-contained server bundle so the Docker image stays small and
  // starts without a full node_modules tree.
  output: "standalone",

  // The prototype must run with no internet access once dependencies are installed.
  // No remote image hosts are configured on purpose — every visual is generated
  // locally as SVG. If you find yourself needing to add a remotePattern here, the
  // asset belongs in the repo instead.
  images: {
    remotePatterns: [],
  },

  // Browser-side API calls (src/lib/api.ts, when window is defined) go through
  // this same-origin proxy instead of a public backend URL baked into the
  // client bundle at build time. Resolved at request time, so it survives a
  // tunnelled/shared deployment without a rebuild, and needs no CORS config
  // since the request never leaves the frontend's own origin.
  async rewrites() {
    const target = process.env.INTERNAL_API_URL ?? "http://backend:8000";
    return [{ source: "/api-proxy/:path*", destination: `${target}/:path*` }];
  },
};

export default nextConfig;
