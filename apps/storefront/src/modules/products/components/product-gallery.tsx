"use client"

import { cn } from "@repo/ui/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@repo/ui/components/carousel"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { Tag } from "lucide-react"
import { useCallback, useLayoutEffect, useState } from "react"

type ProductGalleryProps = {
  product: HttpTypes.StoreProduct
  selectedVariant?: HttpTypes.StoreProductVariant | null
}

type ImageSource = { url: string; alt: string }

function buildImages(
  product: HttpTypes.StoreProduct,
  selectedVariant?: HttpTypes.StoreProductVariant | null
): ImageSource[] {
  const alt = product.title ?? ""

  // 1. Variant-level images take priority when available
  if (selectedVariant) {
    const variantImgs: ImageSource[] = []
    if (selectedVariant.images?.length) {
      selectedVariant.images.forEach((img) => {
        if (img.url) variantImgs.push({ url: img.url, alt })
      })
    } else if (selectedVariant.thumbnail) {
      variantImgs.push({ url: selectedVariant.thumbnail, alt })
    }
    if (variantImgs.length > 0) return variantImgs
  }

  // 2. Fall back to product-level images
  const imgs: ImageSource[] = []
  if (product.images?.length) {
    product.images.forEach((img) => {
      if (img.url) imgs.push({ url: img.url, alt })
    })
  }

  // 3. Final fallback: product thumbnail
  if (imgs.length === 0 && product.thumbnail) {
    imgs.push({ url: product.thumbnail, alt })
  }

  return imgs
}

export function ProductGallery({
  product,
  selectedVariant,
}: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const images = buildImages(product, selectedVariant)

  // Reset carousel to first slide whenever the variant changes
  useLayoutEffect(() => {
    if (api) {
      api.scrollTo(0, true)
      setCurrent(0)
    }
  }, [api, selectedVariant?.id])

  useLayoutEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index)
    },
    [api]
  )

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-accent/40 flex items-center justify-center border border-border/50">
        <Tag className="size-16 text-muted-foreground/20" strokeWidth={1} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main carousel */}
      <Carousel
        setApi={setApi}
        opts={{ loop: images.length > 1 }}
        className="w-full"
      >
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={`${selectedVariant?.id ?? "product"}-${i}`}>
              <div className="relative aspect-square overflow-hidden border border-border/50 bg-accent/40">
                <Image
                  unoptimized
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={i === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-3 rounded-none" />
            <CarouselNext className="right-3 rounded-none" />
          </>
        )}
      </Carousel>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={`${selectedVariant?.id ?? "product"}-thumb-${i}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden border-2 bg-accent/40 transition-all",
                i === current
                  ? "border-primary"
                  : "border-border/50 opacity-60 hover:opacity-100"
              )}
            >
              <Image
                unoptimized
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
