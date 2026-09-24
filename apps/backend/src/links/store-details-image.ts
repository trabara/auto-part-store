import { defineLink } from "@medusajs/framework/utils";
import StoreDetailsModule from "../modules/store-details";
import MediaModule from "@repo/media-plugin/modules/media";

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
