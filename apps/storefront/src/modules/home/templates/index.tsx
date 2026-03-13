import { listCategories, StoreProductCategory } from "@/lib/data/categories"
import { retreiveFitment } from "@/lib/data/fitments"
import { listProducts } from "@/lib/data/products"
import AdvancedSearch from "@/modules/fitment/components/advanced-search"
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
  ChevronRight,
  Headphones,
  RefreshCw,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// ── Hero slides ──────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    eyebrow: "New Season Collection",
    headline: "Engine Parts\nBuilt to Last",
    tagline: "Premium OEM-grade components for every make and model.",
    cta: "Shop Engine Parts",
    href: "/engine-and-drivetrain",
    accent: "from-zinc-950 via-zinc-900 to-zinc-800",
    highlight: "Engine Parts",
  },
  {
    eyebrow: "Best Sellers",
    headline: "Electrical &\nLighting",
    tagline: "Brighten the road. Upgrade your electrical system today.",
    cta: "Shop Electrical",
    href: "/electrical-and-lighting",
    accent: "from-zinc-950 via-zinc-900 to-zinc-800",
    highlight: "Electrical &\nLighting",
  },
  {
    eyebrow: "Trusted Brands",
    headline: "Genuine Parts,\nReal Performance",
    tagline: "Bosch, NGK, Shell and more — sourced direct, priced right.",
    cta: "Browse All Parts",
    href: "/",
    accent: "from-zinc-950 via-zinc-900 to-zinc-800",
    highlight: "Genuine Parts,",
  },
]

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

// ── Trust badges ──────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Nationwide shipping in 24–48h",
  },
  {
    icon: ShieldCheck,
    title: "Genuine Parts",
    desc: "100% OEM & OES certified",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    desc: "30-day hassle-free returns",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    desc: "Mechanics on call, 7 days a week",
  },
]

// ── Promo banners ─────────────────────────────────────────────────────────────

const PROMO_BANNERS = [
  {
    eyebrow: "Limited Time",
    headline: "Up to 40% Off\nEngine Parts",
    cta: "Shop Now",
    href: "/engine-and-drivetrain",
    bg: "bg-zinc-900",
    icon: Wrench,
  },
  {
    eyebrow: "Free Shipping",
    headline: "Orders Over\n200 TND",
    cta: "Start Shopping",
    href: "/",
    bg: "bg-zinc-800",
    icon: Zap,
  },
]

// ── Section heading helper ────────────────────────────────────────────────────

function SectionHeading({
  title,
  href,
  linkLabel = "View All",
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <p className="relative text-2xl font-extrabold uppercase tracking-widest text-foreground">
        <span className="relative">
          {title}
          <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-primary" />
        </span>
      </p>
      {href && (
        <Link
          href={href}
          className="hidden md:inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function HomeTemplate() {
  const [categories, fitment, productsData] = await Promise.all([
    listCategories(),
    retreiveFitment(),
    listProducts({
      pageParam: 1,
      queryParams: { sort: "created_at", limit: 8 },
    }),
  ])

  const bestSellers = productsData.response.products
  const newArrivals = productsData.response.products

  return (
    <div className="">
      {/* ── 1. HERO CAROUSEL ─────────────────────────────────────────────── */}
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {HERO_SLIDES.map((slide, i) => (
            <CarouselItem key={i}>
              <div
                className={cn(
                  "relative flex items-end min-h-[560px] bg-gradient-to-br",
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
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/[0.02] [clip-path:polygon(20%_0,100%_0,100%_100%,0%_100%)]" />

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
                    <p className="!mt-0 text-base md:text-lg text-white/60 font-normal leading-relaxed mb-10 max-w-md">
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
          <div className="flex flex-col lg:flex-row lg:items-start gap-10">
            {/* Left copy */}
            <div className="lg:w-80 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <CarFront className="size-5 opacity-60" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-60">
                  My Garage
                </span>
              </div>
              <p className="!mt-0 text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 text-left">
                Find Parts
                <br />
                For Your
                <br />
                Vehicle
              </p>
              <p
                className="!mt-0 text-sm leading-relaxed max-w-xs"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Select your make, model, and year to get an exact-fit parts list
                for your car.
              </p>
              {fitment && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 text-xs font-semibold">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                  {fitment.model.make.name} · {fitment.model.name} ·{" "}
                  {fitment.year_start}
                </div>
              )}
            </div>

            {/* Right: search form — dark class forces dark-mode tokens on the tabs/inputs */}
            <div className="dark flex-1 bg-white/5 border border-white/10 p-6">
              <AdvancedSearch />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SHOP BY CATEGORY ──────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="snap-container mt-20">
          <SectionHeading title="Shop by Category" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category: StoreProductCategory) => {
              const imageUrl =
                category.product_category_image[0]?.url
              return (
                <Link
                  key={category.id}
                  href={`/${category.handle}`}
                  className="group relative flex flex-col justify-end overflow-hidden bg-zinc-900 min-h-[180px] p-5"
                >
                  {/* Hover accent bar */}
                  <div className="absolute top-0 left-0 h-1 w-0 bg-white transition-all duration-300 group-hover:w-full" />

                  {/* Diagonal bg accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  )}
                  <span className="relative z-10 text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-1">
                    Parts
                  </span>
                  <span className="relative z-10 text-sm font-extrabold uppercase tracking-wider text-white leading-tight">
                    {category.name}
                  </span>
                  <ChevronRight className="absolute bottom-4 right-4 size-4 text-white/25 group-hover:text-white/70 group-hover:translate-x-1 transition-all duration-200" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 5. BEST SELLERS ──────────────────────────────────────────────── */}
      {/* <section className="snap-container mt-20">
        <SectionHeading title="Best Sellers" href="/" />
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
            No products available yet.
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
        <SectionHeading title="New Arrivals" href="/" />
        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {newArrivals.map((product) => (
              <ProductGridItem key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No products available yet.
          </p>
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
                  <p className="!mt-0 text-xs text-primary-foreground/50 leading-relaxed">
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
