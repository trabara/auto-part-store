import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ShoppingCart } from "lucide-react"
import { ComponentProps } from "react"

export default function ShoppingCartButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <Button
      className={cn("hover:bg-accent/50 cursor-pointer", className)}
      {...props}
    >
      <ShoppingCart />
    </Button>
  )
}
