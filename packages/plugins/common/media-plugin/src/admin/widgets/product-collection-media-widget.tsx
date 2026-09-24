import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminCollection, DetailWidgetProps } from "@medusajs/framework/types"
import MediaWidget from "@repo/admin/components/media-widget"

const ProductCollectionMediaWidget = ({ data }: DetailWidgetProps<AdminCollection>) => {
    return <MediaWidget entityId={data.id} entityName="medias" />
}

export const config = defineWidgetConfig({
    zone: "product_collection.details.before",
})

export default ProductCollectionMediaWidget