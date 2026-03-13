import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "http",
        hostname: "minio-api.localhost",
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
