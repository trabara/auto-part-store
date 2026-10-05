import { MedusaService } from "@medusajs/framework/utils";
import { vehicleModels } from "./models/vehicle";

export default class VehicleModuleService extends MedusaService(vehicleModels) {}
