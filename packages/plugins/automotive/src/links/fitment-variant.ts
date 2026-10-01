import { defineLink } from "@medusajs/framework/utils";
import AutomotiveModule from "../modules/automotive";
import ProductModule from "@medusajs/medusa/product";

export default defineLink(
  {
    linkable: AutomotiveModule.linkable.fitment,
    isList: true,
  },
  {
    linkable: ProductModule.linkable.productVariant,
    isList: true,
  },
);
