import { defineLink } from "@medusajs/framework/utils";
import PromotionModule from "@medusajs/medusa/promotion";
import MediaModule from "@repo/domain-modules/media";

export default defineLink(
  {
    linkable: PromotionModule.linkable.campaign,
    field: "id",
    isList: true,
  },
  {
    ...MediaModule.linkable.entityMedia.id,
    primaryKey: "entity_id",
  },
  {
    readOnly: true,
  },
);
