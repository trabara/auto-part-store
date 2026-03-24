import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en-US", "fr-FR", "ar-TN"],
  defaultLocale: "en-US",
  localeDetection: true,
  localeCookie: {
    name: "_medusa_locale",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
})

export type Locale = (typeof routing.locales)[number]
