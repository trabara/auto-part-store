import { defineLink } from "@medusajs/framework/utils"
import PromotionModule from "@medusajs/medusa/promotion"
import EntityMediaModule from "../modules/entity-media"

export default defineLink(
    {
        linkable: PromotionModule.linkable.campaign,
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