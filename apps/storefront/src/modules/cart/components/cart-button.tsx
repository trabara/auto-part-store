"use client"

import { useCartItemCount } from "@/modules/cart/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { ComponentProps } from "react"

export default function ShoppingCartButton({
  ...props
}: ComponentProps<"button"> & { variant?: "ghost" | "outline" | "default" }) {
  const count = useCartItemCount()

  return (
    <div className="relative">
      <Button
        size='icon'
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
