import { Module } from "@medusajs/framework/utils";
import StoreDetailsModuleService from "./services/store-details-module.service";

export { default as StoreDetails } from "./models/store-details";
export { STORE_DETAILS_MODULE, STORE_DETAILS_SINGLETON_ID } from "./constant";

export default Module("storeDetails", {
  service: StoreDetailsModuleService,
});
