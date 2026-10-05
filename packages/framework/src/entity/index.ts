/**
 * Isomorphic entity API (safe for admin code). Server pieces — models,
 * validation middlewares, routes, workflows — are in `./server`.
 */
export { defineEntity, getEntity, resetEntities } from "./define-entity"
export { defineEntities, type EntitySet } from "./define-entities"
export { foreignKeyName, foreignKeys, ownsForeignKey } from "./relations"
export type {
  BatchUpdateDto,
  CreateDto,
  DefineEntityConfig,
  EntityDef,
  EntityDmlSchema,
  EntityModel,
  EntityName,
  EntityQuery,
  EntityRegistry,
  EntityStorage,
  ForeignKeys,
  InferEntity,
  ModelOf,
  RelationBuilder,
  RelationDef,
  RelationKind,
  RelationMap,
  RelationOptions,
  SnakeCase,
  UpdateDto,
  WithRelationsSchema,
} from "./types"
