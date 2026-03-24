import createMiddleware from "next-intl/middleware"
import { NextRequest } from "next/server"
import { routing } from "./i18n/routing"

export async function proxy(request: NextRequest) {
  return createMiddleware(routing)(request)
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api routes
    // - /_next (Next.js internals)
    // - /public (static files)
    // - all root files (favicon.ico, logo.png, etc.)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
}
