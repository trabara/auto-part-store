import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProductCategory, DetailWidgetProps } from "@medusajs/framework/types"
import MediaWidget from "@repo/admin/components/media-widget"

const ProductCategoryMediaWidget = ({ data }: DetailWidgetProps<AdminProductCategory>) => {
    return <MediaWidget entityId={data.id} entityName="medias" />
}

export const config = defineWidgetConfig({
    zone: "product_category.details.side.before",
})

export default ProductCategoryMediaWidget