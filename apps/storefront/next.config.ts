import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      "tw-animate-css": "../../node_modules/tw-animate-css/dist/tw-animate.css",
    },
  },
}

export default nextConfig
