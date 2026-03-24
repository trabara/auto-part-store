import { defineLink } from "@medusajs/framework/utils";
import StoreModule from "@medusajs/medusa/store";
import StoreDetailsModule from "../modules/store-details";

export default defineLink(
  {
    linkable: StoreModule.linkable.store,
    isList: false,
  },
  {
    linkable: StoreDetailsModule.linkable.storeDetails,
    isList: false,
  },
);
