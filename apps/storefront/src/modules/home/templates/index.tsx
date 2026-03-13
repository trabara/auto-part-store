import SectionHeading from "@/components/section-heading"
import { listCategories, StoreProductCategory } from "@/lib/data/categories"
import { retreiveFitment } from "@/lib/data/fitments"
import { listProducts } from "@/lib/data/products"
import ProductCategoryCard from "@/modules/categories/components/category-card"
import AdvancedSearch from "@/modules/fitment/components/advanced-search"
import { FitmentCTA } from "@/modules/fitment/components/fitment-cta"
import { ProductGridItem } from "@/modules/products/components/product-item"
import { Button } from "@repo/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@repo/ui/components/carousel"
import { Marquee, MarqueeContent } from "@repo/ui/components/marquee"
import { cn } from "@repo/ui/lib/utils"
import {
  ArrowRight,
  CarFront,
  Headphones,
  RefreshCw,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

// ── Brand chips ───────────────────────────────────────────────────────────────

const BRANDS = [
  "BOSCH",
  "NGK",
  "SHELL",
  "DENSO",
  "VALEO",
  "MANN",
  "GATES",
  "MONROE",
  "SACHS",
  "DELPHI",
  "PIERBURG",
  "BREMBO",
]

// ── Component ─────────────────────────────────────────────────────────────────

export default async function HomeTemplate() {
  const [categories, fitment, productsData, t] = await Promise.all([
    listCategories(),
    retreiveFitment(),
    listProducts({
      pageParam: 1,
      queryParams: { sort: "created_at", limit: 8 },
    }),
    getTranslations("home"),
  ])

  const bestSellers = productsData.response.products
  const newArrivals = productsData.response.products

  // ── Hero slides ──────────────────────────────────────────────────────────────
  const HERO_SLIDES = [
    {
      eyebrow: t("heroSlides.0.eyebrow"),
      headline: t("heroSlides.0.headline"),
      tagline: t("heroSlides.0.tagline"),
      cta: t("heroSlides.0.cta"),
      href: "/engine-and-drivetrain",
      accent: "from-zinc-950 via-zinc-900 to-zinc-800",
    },
    {
      eyebrow: t("heroSlides.1.eyebrow"),
      headline: t("heroSlides.1.headline"),
      tagline: t("heroSlides.1.tagline"),
      cta: t("heroSlides.1.cta"),
      href: "/electrical-and-lighting",
      accent: "from-zinc-950 via-zinc-900 to-zinc-800",
    },
    {
      eyebrow: t("heroSlides.2.eyebrow"),
      headline: t("heroSlides.2.headline"),
      tagline: t("heroSlides.2.tagline"),
      cta: t("heroSlides.2.cta"),
      href: "/",
      accent: "from-zinc-950 via-zinc-900 to-zinc-800",
    },
  ]

  // ── Trust badges ──────────────────────────────────────────────────────────────
  const TRUST_BADGES = [
    {
      icon: Truck,
      title: t("trustBadges.fastDelivery.title"),
      desc: t("trustBadges.fastDelivery.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("trustBadges.genuineParts.title"),
      desc: t("trustBadges.genuineParts.desc"),
    },
    {
      icon: RefreshCw,
      title: t("trustBadges.easyReturns.title"),
      desc: t("trustBadges.easyReturns.desc"),
    },
    {
      icon: Headphones,
      title: t("trustBadges.expertSupport.title"),
      desc: t("trustBadges.expertSupport.desc"),
    },
  ]

  // ── Promo banners ─────────────────────────────────────────────────────────────
  const PROMO_BANNERS = [
    {
      eyebrow: t("promoBanners.0.eyebrow"),
      headline: t("promoBanners.0.headline"),
      cta: t("promoBanners.0.cta"),
      href: "/engine-and-drivetrain",
      bg: "bg-zinc-900",
      icon: Wrench,
    },
    {
      eyebrow: t("promoBanners.1.eyebrow"),
      headline: t("promoBanners.1.headline"),
      cta: t("promoBanners.1.cta"),
      href: "/",
      bg: "bg-zinc-800",
      icon: Zap,
    },
  ]

  return (
    <div className="">
      {/* ── 1. HERO CAROUSEL ─────────────────────────────────────────────── */}
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {HERO_SLIDES.map((slide, i) => (
            <CarouselItem key={i}>
              <div
                className={cn(
                  "relative flex items-end min-h-[560px] bg-linear-to-br",
                  slide.accent
                )}
              >
                {/* Grid texture overlay */}
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Diagonal accent stripe */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/2 [clip-path:polygon(20%_0,100%_0,100%_100%,0%_100%)]" />

                <div className="snap-container relative z-10 w-full pb-16 pt-8">
                  <div className="max-w-2xl">
                    {/* Eyebrow */}
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40 mb-4">
                      {slide.eyebrow}
                    </p>

                    {/* Headline — div avoids global h1 text-center rule */}
                    <div className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight text-white leading-[0.95] mb-6 whitespace-pre-line text-left">
                      {slide.headline}
                    </div>

                    {/* Tagline — mt-0! cancels global p [&:not(:first-child)]:mt-6 */}
                    <p className="mt-0! text-base md:text-lg text-white/60 font-normal leading-relaxed mb-10 max-w-md">
                      {slide.tagline}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-4">
                      <Button
                        asChild
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-xs px-8 h-12"
                      >
                        <Link href={slide.href}>
                          {slide.cta}
                          <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Slide counter */}
                <div className="absolute bottom-6 right-6 text-white/20 font-mono text-xs tracking-widest">
                  0{i + 1} / 0{HERO_SLIDES.length}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white size-11 rounded-none" />
        <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white size-11 rounded-none" />
      </Carousel>

      {/* ── 2. BRAND MARQUEE ─────────────────────────────────────────────── */}
      <div className="border-y border-border/60 bg-accent/30 py-1">
        <Marquee>
          <MarqueeContent className="gap-0">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span key={i} className="inline-flex items-center gap-6 px-6">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground/70">
                  {brand}
                </span>
                <span className="text-muted-foreground/30 text-lg font-thin">
                  /
                </span>
              </span>
            ))}
          </MarqueeContent>
        </Marquee>
      </div>

      {/* ── 3. VEHICLE FITMENT CTA ───────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-14">
        <div className="snap-container">
          <FitmentCTA fitment={fitment} />
        </div>
      </section>

      {/* ── 4. SHOP BY CATEGORY ──────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="snap-container mt-20">
          <SectionHeading title={t("shopByCategory")} />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category: StoreProductCategory) => (
              <ProductCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. BEST SELLERS ──────────────────────────────────────────────── */}
      {/* <section className="snap-container mt-20">
        <SectionHeading title={t("bestSellers")} href="/" />
        {bestSellers.length > 0 ? (
          <Carousel opts={{ align: "start" }}>
            <CarouselContent className="-ml-3 pb-4">
              {bestSellers.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="pl-3 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <ProductGridItem product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 size-9" />
            <CarouselNext className="-right-4 size-9" />
          </Carousel>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("noProductsYet")}
          </p>
        )}
      </section> */}

      {/* ── 6. PROMO BANNERS ─────────────────────────────────────────────── */}
      <section className="snap-container mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROMO_BANNERS.map((banner, i) => {
            const Icon = banner.icon
            return (
              <Link
                key={i}
                href={banner.href}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden p-10 min-h-[260px]",
                  banner.bg
                )}
              >
                {/* Texture */}
                <div
                  className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,1) 0, rgba(255,255,255,1) 1px, transparent 0, transparent 50%)",
                    backgroundSize: "12px 12px",
                  }}
                />

                {/* Large bg icon */}
                <Icon className="absolute -right-4 -bottom-4 size-36 text-white/5 group-hover:text-white/10 transition-colors duration-300" />

                <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-3">
                    {banner.eyebrow}
                  </p>
                  <h3 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white whitespace-pre-line leading-[1.05]">
                    {banner.headline}
                  </h3>
                </div>

                <div className="relative z-10 mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors duration-200">
                  {banner.cta}
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── 7. NEW ARRIVALS ──────────────────────────────────────────────── */}
      <section className="snap-container mt-20">
        <SectionHeading title={t("newArrivals")} href="/" />
        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {newArrivals.map((product) => (
              <ProductGridItem key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noProductsYet")}</p>
        )}
      </section>

      {/* ── 8. TRUST BADGES ──────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground mt-20 py-16">
        <div className="snap-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {TRUST_BADGES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-4">
                <div className="p-3 border border-primary-foreground/15 bg-primary-foreground/5">
                  <Icon className="size-7 text-primary-foreground/80" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold uppercase tracking-widest">
                    {title}
                  </p>
                  <p className="mt-0! text-xs text-primary-foreground/50 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
