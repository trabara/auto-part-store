import { defineLink } from "@medusajs/framework/utils";
import MediaModule from "@repo/domain-modules/media";
import StoreDetailsModule from "../modules/store-details";

export default defineLink(
  {
    linkable: StoreDetailsModule.linkable.storeDetails,
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
