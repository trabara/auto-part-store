import { Module } from "@medusajs/framework/utils";
import FitmentModuleService from "./services/fitment-module.service";
import * as Models from "./models";

export const FITMENT_MODULE = "fitment";

// Register DML models on the service so Module() can build linkable keys
const _modelObjectsSymbol = Symbol.for("MedusaServiceModelObjectsSymbol");
(FitmentModuleService as any)[_modelObjectsSymbol] = {
  Make: Models.Make,
  Model: Models.Model,
  Engine: Models.Engine,
  Fitment: Models.Fitment,
};

export default Module(FITMENT_MODULE, {
  service: FitmentModuleService,
});

export type { FitmentModuleService };
