import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Avoid Turbopack bundling issues with optional jwa deps (web-push push API). */
  serverExternalPackages: ["web-push"],
};

export default nextConfig;
