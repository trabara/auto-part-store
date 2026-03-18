import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: process.env.STORAGE_HOST || "localhost",
      },
    ],
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: true,
  },
  turbopack: {
    resolveAlias: {
      "tw-animate-css": "../../node_modules/tw-animate-css/dist/tw-animate.css",
    },
  },
}

export default withNextIntl(nextConfig)
