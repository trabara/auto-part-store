import { Module } from "@medusajs/framework/utils";
import { FITMENT_MODULE } from "./constants";
import FitmentModuleService from "./service";

export { FITMENT_MODULE };

export default Module(FITMENT_MODULE, {
  service: FitmentModuleService,
});

export { type FitmentModuleService };
