import { Module } from "@medusajs/framework/utils";
import AutomotiveModuleService from "./service";

export const AUTOMOTIVE_MODULE = "automotive";

export default Module(AUTOMOTIVE_MODULE, {
  service: AutomotiveModuleService,
});
