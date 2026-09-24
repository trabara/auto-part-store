import { Module } from "@medusajs/framework/utils";
import { ANALYTICS_MODULE } from "./constant";

export { ANALYTICS_MODULE };

// Minimal module — no data models, service is a stub.
class AnalyticsModuleService {}

export default Module(ANALYTICS_MODULE, {
  service: AnalyticsModuleService,
});
