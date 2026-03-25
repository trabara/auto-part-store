import { LocaleSwitcher } from "@/components/locale-switcher"
import { routing } from "@/i18n/routing"
import { retrieveCart } from "@/lib/data/cart"
import { listCategories } from "@/lib/data/categories"
import CartSheet from "@/modules/cart/components/cart-sheet"
import { CartProvider } from "@/modules/cart/components/provider"
import { CategoryMenuSheet } from "@/modules/categories/components/category-menu-sheet"
import FitmentBadge from "@/modules/fitment/components/fitment-badge"
import { SearchWithAutocomplete } from "@/modules/search/components/search-with-autocomplete"
import { SimpleSearchWithForm } from "@/modules/search/components/simple-search-with-form"
import { Button } from "@repo/ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@repo/ui/components/button-group"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet"
import { cn } from "@repo/ui/lib/utils"
import { Car, CarFront, Menu, Search, User } from "lucide-react"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import { Akshar, Noto_Sans_Arabic } from "next/font/google"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ModeToggle } from "@/components/mode-toogle"
import { ThemeProvider } from "@/components/theme-provider"
import { retrieveStoreDetails } from "@/lib/data/store"
import Image from "next/image"

import "@/styles/globals.css"

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

  const [messages, t, categories, initialCart, storeDetails] =
    await Promise.all([
      await getMessages(),
      await getTranslations({ locale, namespace: "layout" }),
      await listCategories().catch(() => []),
      await retrieveCart().catch(() => null),
      await retrieveStoreDetails().catch(() => null),
    ])
    
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <html
        lang={locale}
        dir={dir}
        data-mode="light"
        className={cn(akshar.variable, notoSansArabic.variable)}
      >
        <body
          className={cn("h-screen", {
            "font-(family-name:--font-noto-sans-arabic)": isRtl,
            [akshar.className]: !isRtl,
          })}
        >
          <NextIntlClientProvider messages={messages}>
            <CartProvider initialCart={initialCart}>
              {/** Header **/}
              <header className="relative h-22 xl:h-42.5">
                <div className="fixed inset-0 z-50 w-full h-fit">
                  <div className="bg-zinc-100 dark:bg-zinc-950">
                    <div className="snap-container">
                      <div className="hidden xl:block border-b border-b-accent/20 py-2">
                        <div className="space-x-2 flex justify-between items-center">
                          <div className="text-primary">
                            <Link href="/about-us">
                              <Button variant="link" size="sm">
                                {t("aboutUs")}
                              </Button>
                            </Link>
                            <Link href="/faq">
                              <Button variant="link" size="sm">
                                {t("faq")}
                              </Button>
                            </Link>
                            <Link href="/order-tracking">
                              <Button variant="link" size="sm">
                                {t("orderTracking")}
                              </Button>
                            </Link>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>🇹🇳</span>
                            <LocaleSwitcher />
                            <ModeToggle />
                          </div>
                        </div>
                      </div>

                      <div className="xl:mt-4 flex justify-between space-x-4 py-2 xl:py-4">
                        <CategoryMenuSheet categories={categories}>
                          <Button
                            variant="ghost"
                            className="inline-flex items-center xl:hidden hover:bg-accent-foreground/10 text-accent"
                          >
                            <Menu />
                            <span className="hidden xl:block ml-2">
                              {t("allCategories")}
                            </span>
                          </Button>
                        </CategoryMenuSheet>

                        <Link href="/">
                          <Image
                            width={128}
                            height={32}
                            src={storeDetails?.logo_url || "/default-logo.png"}
                            alt="Store Logo"
                          />
                        </Link>

                        <FitmentBadge className="hidden xl:inline-flex">
                          <Button
                            variant="ghost"
                            className="hidden xl:inline-flex hover:bg-accent/50 cursor-pointer "
                          >
                            <CarFront />
                            {t("myGarage")}
                          </Button>
                        </FitmentBadge>

                        {/** Search Input */}
                        <SearchWithAutocomplete className="hidden xl:block flex-1" />

                        {/** User Actions */}
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            className="hidden xl:flex hover:bg-accent/50 cursor-pointer"
                          >
                            <User />
                            <div className="flex-col  ml-2 hidden xl:flex">
                              <div className="">{t("account")}</div>
                              <div className="text-xs">
                                {t("loginRegister")}
                              </div>
                            </div>
                          </Button>

                          <CartSheet
                            className="flex-1 overflow-hidden"
                            direction={isRtl ? "left" : "right"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-950 border-y border-b-accent">
                    <div className="snap-container py-1">
                      <CategoryMenuSheet
                        categories={categories}
                        direction={isRtl ? "right" : "left"}
                      >
                        <Button
                          variant="ghost"
                          className="hidden xl:inline-flex hover:bg-accent-foreground/10"
                        >
                          <Menu />
                          <span className="hidden xl:block ml-2">
                            {t("allCategories")}
                          </span>
                        </Button>
                      </CategoryMenuSheet>
                      <ButtonGroup className="flex xl:hidden w-full">
                        <FitmentBadge className="flex-1">
                          <Button variant="ghost" className="flex-1">
                            <Car />
                            {t("myGarage")}
                          </Button>
                        </FitmentBadge>

                        <ButtonGroupSeparator orientation="vertical" />

                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" className="flex-1">
                              <Search />
                              {t("searchProduct")}
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="top" className="pt-10">
                            <SheetHeader className="sr-only">
                              <SheetTitle>{t("searchProduct")}</SheetTitle>
                            </SheetHeader>
                            <div className="snap-container pb-4">
                              <SimpleSearchWithForm />
                            </div>
                          </SheetContent>
                        </Sheet>
                      </ButtonGroup>
                    </div>
                  </div>
                </div>
              </header>
              {/** Main Content */}
              <main>{children}</main>
              {/** Footer */}
              <footer className="border-t border-t-accent-foreground/10 bg-zinc-100 dark:bg-zinc-950">
                <div className="snap-container py-6 text-primary">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                    {storeDetails?.logo_url && (
                      <Link href="/">
                        <Image
                          width={128}
                          height={64}
                          src={storeDetails?.logo_url}
                          alt="Store Logo"
                        />
                      </Link>
                    )}


                    <div>
                      <h3 className="font-semibold mb-2">
                        {t("customerService")}
                      </h3>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <Link href="/help">{t("helpContact")}</Link>
                        </li>
                        <li>
                          <Link href="/returns">{t("returnsRefunds")}</Link>
                        </li>
                        <li>
                          <Link href="/shipping">{t("shippingInfo")}</Link>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">
                        {t("aboutUsFooter")}
                      </h3>
                      <ul className="space-y-1 text-sm">
                        <li>
                          <Link href="/about">{t("ourStory")}</Link>
                        </li>
                        <li>
                          <Link href="/careers">{t("careers")}</Link>
                        </li>
                        <li>
                          <Link href="/press">{t("press")}</Link>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{t("followUs")}</h3>
                      <ul className="space-y-1 text-sm">
                        {Object.keys(storeDetails?.social_links ?? {}).map((key) => {
                          return <li key={key}>
                            <Link href={storeDetails?.social_links?.[key] || "#"}>
                              {key}
                            </Link>
                          </li>
                        })}
                      </ul>

                      {storeDetails?.contact_emails?.length ? (
                        <div className="mt-3 text-sm">
                          {storeDetails.contact_emails.map((email) => (
                            <div key={email}>
                              <a href={`mailto:${email}`}>{email}</a>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {storeDetails?.contact_phone_numbers?.length ? (
                        <div className="mt-1 text-sm">
                          {storeDetails.contact_phone_numbers.map((phone) => (
                            <div key={phone}>{phone}</div>
                          ))}
                        </div>
                      ) : null}
                      {storeDetails?.address ? (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {storeDetails.address}
                        </div>
                      ) : null}

                    </div>

                    {storeDetails?.map_url && (
                      <div>
                        <h3 className="font-semibold mb-2">{t("ourLocation")}</h3>

                        <iframe
                          src={storeDetails.map_url}
                          width="100%"
                          height="120"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="rounded-md"
                          title="Store Location"
                        />

                      </div>
                    )}
                  </div>
                  <div className="text-center text-xs mt-4">
                    {t("copyright", {
                      year: new Date().getFullYear(),
                      name: storeDetails?.name ?? "Store",
                    })}
                  </div>
                </div>
              </footer>
            </CartProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ThemeProvider>
  )
}
