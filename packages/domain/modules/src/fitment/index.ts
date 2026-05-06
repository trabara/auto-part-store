import { Module } from "@medusajs/framework/utils";
import FitmentModuleService from "./services/fitment-module.service";
import setupFitmentPermissionsLoader from "./loaders/setup-permissions";

export const FITMENT_MODULE = "fitment";

export default Module(FITMENT_MODULE, {
  service: FitmentModuleService,
  // loaders: [setupFitmentPermissionsLoader],
});

export type { FitmentModuleService };
