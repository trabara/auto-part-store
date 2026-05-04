import { Module } from "@medusajs/framework/utils";
import MediaModuleService from "./service";

export const ENTITY_MEDIA_MODULE = "media";

export default Module(ENTITY_MEDIA_MODULE, {
  service: MediaModuleService,
});

export type { MediaModuleService };
