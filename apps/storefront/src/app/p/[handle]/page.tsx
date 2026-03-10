import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductByHandle } from "@/lib/data/products"
import { getProductFitments, retreiveFitment } from "@/lib/data/fitments"
import { ProductDetailTemplate } from "@/modules/products/templates/product-detail-template"

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

  const fitments = await getProductFitments(product.id)

  return (
    <ProductDetailTemplate
      product={product}
      fitments={fitments}
      activeFitment={activeFitment}
    />
  )
}
