import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import MediaModule from "@repo/domain-modules/media";

export default defineLink(
  {
    linkable: ProductModule.linkable.productCollection,
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
