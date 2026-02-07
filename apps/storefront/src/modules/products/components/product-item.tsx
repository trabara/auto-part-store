import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { StoreProduct } from "@medusajs/types"
import Image from "next/image"
import { createElement, HTMLAttributes } from "react"
import { getProductPrice } from "../utils"
import { WishlistButton } from "./whishlist-button"
import { Display } from "../types"

type ProductItemProps = HTMLAttributes<HTMLDivElement> & {
  product: StoreProduct
}

export function ProductGridItem({
  product,
  className,
  ...props
}: ProductItemProps) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const isSale = cheapestPrice?.price_type === "sale"

  return (
    <div className={cn("flex flex-col space-y-4", className)} {...props}>
      <div className="relative">
        {isSale && (
          <Badge className="absolute top-2 left-2 z-20 bg-destructive text-destructive-foreground">
            {cheapestPrice?.percentage_diff}%
          </Badge>
        )}
        {product.thumbnail && (
          <Image
            className="object-cover"
            src={product.thumbnail}
            alt={product.title}
            width={300}
            height={300}
          />
        )}
      </div>

      <div className="flex flex-col space-y-4">
        <h6 className="line-clamp-2">{product?.title}</h6>
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold">
            {cheapestPrice?.calculated_price}
          </span>
          {isSale && (
            <span className="text-sm text-muted-foreground line-through">
              {cheapestPrice?.original_price}
            </span>
          )}
        </div>
        <Button>Add to cart</Button>
      </div>
    </div>
  )
}

export function ProductListItem({
  product,
  className,
  ...props
}: ProductItemProps) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const isSale = cheapestPrice?.price_type === "sale"

  return (
    <div className={cn("flex gap-4", className)} {...props}>
      <div className="relative size-32 md:size-48">
        {product.thumbnail && (
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={300}
            height={300}
            className="object-cover h-full"
          />
        )}
      </div>

      <div className="flex flex-col justify-between flex-1">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h6 className="text-md md:text-lg font-medium line-clamp-2">
              {product.title}
            </h6>
            <WishlistButton className="hidden md:flex" />
          </div>

          <div className="text-sm text-foreground/50 line-clamp-1">
            {product.description}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <span className="text-2xl font-semibold">
              {cheapestPrice?.calculated_price}
            </span>
            {isSale && (
              <span className="text-md text-muted-foreground line-through">
                {cheapestPrice?.original_price}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:block w-1/6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-semibold">
            {cheapestPrice?.calculated_price}
          </span>
          {isSale && (
            <span className="text-md text-muted-foreground line-through">
              {cheapestPrice?.original_price}
            </span>
          )}
        </div>
        <Button className="mt-4 w-full">Add to cart</Button>
      </div>
    </div>
  )
}

export default function ProductQuantityItem({
  product,
}: {
  product: StoreProduct
}) {}

export function createViewProductItem(display: Display) {
  return function ProductItem(props?: ProductItemProps) {
    if (display === "grid") {
      return createElement(ProductGridItem, props)
    } else if (display === "list") {
      return createElement(ProductListItem, props)
    } else {
      throw new Error(`Unknown view type: ${display}`)
    }
  }
}
