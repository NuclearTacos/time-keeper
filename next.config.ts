import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking is handled by `tsc --noEmit` in the build script.
    // Next.js's built-in checker overflows the stack on Convex's recursive types.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
