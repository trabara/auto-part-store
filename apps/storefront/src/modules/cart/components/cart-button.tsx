"use client"

import { Badge } from "@repo/ui/components/badge"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"
import { ShoppingCart } from "lucide-react"
import { ComponentProps } from "react"
import { useCartItemCount } from "@/modules/cart/hooks/use-cart"

export default function ShoppingCartButton({
  className,
  ...props
}: ComponentProps<"button">) {
  const count = useCartItemCount()

  return (
    <div className="relative">
      <Button
        className={cn("hover:bg-accent/50 cursor-pointer", className)}
        {...props}
      >
        <ShoppingCart />
      </Button>
      {count > 0 && (
        <Badge
          className="absolute -top-2 -right-2 size-5 rounded-full font-semibold"
          variant="secondary"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </div>
  )
}
