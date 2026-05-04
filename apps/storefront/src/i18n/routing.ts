import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "fr", "ar"],
  defaultLocale: "en",
  localeDetection: true,
  localeCookie: {
    name: "_medusa_locale",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
})

export type Locale = (typeof routing.locales)[number]
