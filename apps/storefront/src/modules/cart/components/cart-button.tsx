import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ShoppingCart } from "lucide-react"
import { ComponentProps } from "react"

export default function ShoppingCartButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <div className="relative">
      <Button
        className={cn("hover:bg-accent/50 cursor-pointer", className)}
        {...props}
      >
        <ShoppingCart />
      </Button>
      <Badge
        className="absolute -top-2 -right-2 size-5 rounded-full font-semibold"
        variant="secondary"
      >
        8
      </Badge>
    </div>
  )
}
