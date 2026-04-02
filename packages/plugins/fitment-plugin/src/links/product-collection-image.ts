import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import EntityMediaModule from "../modules/entity-media"

export default defineLink(
    {
        linkable: ProductModule.linkable.productCollection,
        field: "id",
        isList: true,
    },
    {
        ...EntityMediaModule.linkable.entityImage.id,
        primaryKey: "entity_id",
    },
    {
        readOnly: true,
    }
)