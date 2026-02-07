import StoreTemplate from "@/modules/store/templates"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  return <StoreTemplate />
}
