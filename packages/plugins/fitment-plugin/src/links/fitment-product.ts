import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import FitmentModule from "../modules/fitment";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
    deleteCascade: true,
  },
  {
    linkable: FitmentModule.linkable.fitment,
    isList: true,
    deleteCascade: true
  },
);
