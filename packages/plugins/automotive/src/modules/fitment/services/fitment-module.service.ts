import { MedusaService } from "@medusajs/framework/utils";
import * as DML from "../models";

export default class FitmentModuleService extends MedusaService({
  Vehicle: DML.Vehicle,
  VehicleMake: DML.VehicleMake,
  VehicleModel: DML.VehicleModel,
  VehicleEngine: DML.VehicleEngine,
}) {}
