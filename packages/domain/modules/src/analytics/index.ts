import { Module } from "@medusajs/framework/utils";
import { ANALYTICS_MODULE } from "./constant";
import setupAnalyticsPermissionsLoader from "./loaders/setup-permissions";

export { ANALYTICS_MODULE };

// Minimal module — no data models, service is a stub.
// Exists solely to register the analytics permissions loader.
class AnalyticsModuleService {}

export default Module(ANALYTICS_MODULE, {
  service: AnalyticsModuleService,
  // loaders: [setupAnalyticsPermissionsLoader],
});
