import Layout from "@/modules/app/containers/app-layout"
import { NextPageWithLayout } from "@/modules/app/types"

const ProductPage: NextPageWithLayout = () => {
  return <div>Product Page</div>
}

ProductPage.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>
}

export default ProductPage
