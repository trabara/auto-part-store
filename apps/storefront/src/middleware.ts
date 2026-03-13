import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

export default createMiddleware(routing)

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
