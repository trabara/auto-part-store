import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProductCategory, DetailWidgetProps } from "@medusajs/framework/types"
import EntityMediaWidget from "../modules/entity-media/components/entity-media-widget"


export default function PromotionCampaignMediaWidget({ data }: DetailWidgetProps<AdminProductCategory>) {
    return <EntityMediaWidget entityId={data.id} entityName="medias" />
}

export const config = defineWidgetConfig({
    zone: "campaign.details.side.before",
})