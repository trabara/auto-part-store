import AppLayout from "@/modules/app/containers/app-layout"
import { NextPageWithLayout } from "@/modules/app/types"

const CartPage: NextPageWithLayout = () => {
  return <div>Cart Page</div>
}

CartPage.getLayout = function getLayout(page: React.ReactNode) {
  return <AppLayout>{page}</AppLayout>
}

export default CartPage
