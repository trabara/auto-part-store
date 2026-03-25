import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminCollection, DetailWidgetProps } from "@medusajs/framework/types"
import EntityMediaWidget from "../modules/entity-media/components/entity-media-widget"

const ProductCollectionMediaWidget = ({ data }: DetailWidgetProps<AdminCollection>) => {
    return <EntityMediaWidget entityId={data.id} entityName="medias" />
}

export const config = defineWidgetConfig({
    zone: "product_collection.details.before",
})

export default ProductCollectionMediaWidget