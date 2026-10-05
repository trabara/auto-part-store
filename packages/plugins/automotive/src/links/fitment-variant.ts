import { defineLink } from "@medusajs/framework/utils";
import FitmentModule from "../modules/fitment";
import ProductModule from "@medusajs/medusa/product";

export default defineLink(
    {
    linkable: FitmentModule.linkable.fitment,
    isList: true,
  },
  {
    linkable: ProductModule.linkable.productVariant,
    isList: true,
  },
);
