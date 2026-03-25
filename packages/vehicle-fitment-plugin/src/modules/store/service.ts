import { MedusaService } from "@medusajs/framework/utils";
import StoreDetails from "./models/store-details";

class StoreDetailsModuleService extends MedusaService({
  StoreDetails,
}) {}

export default StoreDetailsModuleService;
