import { Module } from "@medusajs/framework/utils";
import EntityMediaModuleService from "./service";
import EntityImage from "./models/entity-image";

export const ENTITY_MEDIA_MODULE = "entityMedia";

// Register DML models on the service so Module() can build linkable keys
const _modelObjectsSymbol = Symbol.for("MedusaServiceModelObjectsSymbol");
(EntityMediaModuleService as any)[_modelObjectsSymbol] = {
  EntityImage,
};

export default Module(ENTITY_MEDIA_MODULE, {
  service: EntityMediaModuleService,
});

export type { EntityMediaModuleService };
