import { StoreProduct } from "@medusajs/types"
import { EmptyShoppingCartIcon } from "@repo/icons"
import { Button } from "@repo/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty"

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
