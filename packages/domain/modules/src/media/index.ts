import { Module } from "@medusajs/framework/utils";
import MediaModuleService from "./service";
import setupMediaPermissionsLoader from "./loaders/setup-permissions";

export const ENTITY_MEDIA_MODULE = "media";

export default Module(ENTITY_MEDIA_MODULE, {
  service: MediaModuleService,
  // loaders: [setupMediaPermissionsLoader],
});

export type { MediaModuleService };
