"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { useWishlist } from "@/modules/wishlist/hooks/use-wishlist"
import { cn } from "@/lib/utils"
import { VariantProps } from "class-variance-authority"
import { HeartIcon, Loader2 } from "lucide-react"

type WishlistButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    productId: string
    variantId: string
  }

export function WishlistButton({
  className,
  productId,
  variantId,
  ...props
}: WishlistButtonProps) {
  const { wishlisted, toggle, isPending } = useWishlist(productId, variantId)

  return (
    <Button
      size="icon"
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle()
      }}
      className={cn(
        "bg-primary/10 hover:bg-primary/20 rounded-full",
        className
      )}
      disabled={isPending}
      {...props}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <HeartIcon
          className={cn(
            wishlisted ? "fill-destructive stroke-destructive" : "stroke-white"
          )}
        />
      )}
      <span className="sr-only">
        {wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      </span>
    </Button>
  )
}
