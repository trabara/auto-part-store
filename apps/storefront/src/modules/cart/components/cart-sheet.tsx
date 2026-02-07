import EmptyShoppingCartIcon from "@/components/icons/empty-shopping-cart"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { StoreProduct } from "@medusajs/types"

export default function CartList({ products }: { products: StoreProduct[] }) {
  return (
    <div>
      {products.length === 0 ? (
        <div></div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <EmptyShoppingCartIcon className="size-16" />
            </EmptyMedia>
            <EmptyTitle className="text-muted-foreground">
              No products in the cart.
            </EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button>Return to Shop</Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
