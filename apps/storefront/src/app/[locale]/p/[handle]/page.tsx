import { getProductFitments, retreiveFitment } from "@/lib/data/fitments"
import { getProductByHandle, getRelatedProducts } from "@/lib/data/products"
import { ProductDetailTemplate } from "@/modules/products/templates/product-detail-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) return {}
  return {
    title: `${product.title} | SnapStore`,
    description: product.description ?? product.subtitle ?? undefined,
    openGraph: {
      images: product.thumbnail ? [{ url: product.thumbnail }] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params
  const [product, activeFitment] = await Promise.all([
    getProductByHandle(handle),
    retreiveFitment(),
  ])
  if (!product) notFound()

  const [fitments, relatedProducts] = await Promise.all([
    getProductFitments(product.id),
    getRelatedProducts(product, 4),
  ])

  return (
    <ProductDetailTemplate
      product={product}
      fitments={fitments}
      activeFitment={activeFitment}
      relatedProducts={relatedProducts}
    />
  )
}
