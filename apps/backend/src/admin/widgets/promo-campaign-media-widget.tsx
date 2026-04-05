import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminProductCategory, DetailWidgetProps } from "@medusajs/framework/types"
import MediaWidget from "@repo/admin/components/media-widget"


export default function PromotionCampaignMediaWidget({ data }: DetailWidgetProps<AdminProductCategory>) {
    return <MediaWidget entityId={data.id} entityName="medias" />
}

export const config = defineWidgetConfig({
    zone: "campaign.details.side.before",
})