'use client'

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/util/cn"
import { VariantProps } from "class-variance-authority"
import { HeartIcon } from "lucide-react"
import { useState } from "react"

type WishlistButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function WishlistButton({ className, ...props }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false)

  return (
    <Button
      size="icon"
      onClick={() => setIsWishlisted(!isWishlisted)}
      className={cn("bg-primary/10 hover:bg-primary/20 rounded-full", className)}
    >
      <HeartIcon
        className={cn(
          isWishlisted ? "fill-destructive stroke-destructive" : "stroke-white"
        )}
      />
      <span className="sr-only">Like</span>
    </Button>
  )
}
