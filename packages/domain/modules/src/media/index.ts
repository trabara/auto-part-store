import { Module } from "@medusajs/framework/utils";
import MediaModuleService from "./service";
import { Media } from "./models/media";

export const ENTITY_MEDIA_MODULE = "media";

// Register DML models on the service so Module() can build linkable keys
const _modelObjectsSymbol = Symbol.for("MedusaServiceModelObjectsSymbol");
(MediaModuleService as any)[_modelObjectsSymbol] = {
  Media,
};

export default Module(ENTITY_MEDIA_MODULE, {
  service: MediaModuleService,
});

export type { MediaModuleService };
