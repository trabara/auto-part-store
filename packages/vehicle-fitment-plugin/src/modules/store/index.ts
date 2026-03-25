import { Module } from "@medusajs/framework/utils";
import StoreDetailsModuleService from "./service";

export const STORE_DETAILS_MODULE = "storeDetails";

export default Module(STORE_DETAILS_MODULE, {
  service: StoreDetailsModuleService,
});
