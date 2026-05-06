import { routing } from "@/i18n/routing"
import { retrieveCart } from "@/lib/data/cart"
import { cn } from "@/lib/utils"
import { CartProvider } from "@/modules/cart/components/provider"
import { WishlistProvider } from "@/modules/wishlist/components/wishlist-provider"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import { Akshar, Noto_Sans_Arabic } from "next/font/google"
import { notFound } from "next/navigation"

import { ThemeProvider } from "@/components/theme-provider"

const akshar = Akshar({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-akshar",
})

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-noto-arabic",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://snapstore.com"),
  title: "SnapStore - Your One-Stop Shop for Auto Parts",
  description:
    "Discover a wide range of high-quality auto parts at SnapStore. Shop with confidence and get your vehicle back on the road in no time.",
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const isRtl = locale.startsWith("ar")
  const dir = isRtl ? "rtl" : "ltr"

  const [messages, initialCart] =
    await Promise.all([
      await getMessages(),
      await retrieveCart().catch(() => null)
    ])

  return (
    <html
      lang={locale}
      dir={dir}
      data-mode="light"
      suppressHydrationWarning
      className={cn(akshar.variable, notoSansArabic.variable)}
    >
      <body
        className={cn("h-screen", {
          "font-(family-name:--font-noto-sans-arabic)": isRtl,
          [akshar.className]: !isRtl,
        })}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <CartProvider initialCart={initialCart}>
              <WishlistProvider>
                {children}
              </WishlistProvider>
            </CartProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
