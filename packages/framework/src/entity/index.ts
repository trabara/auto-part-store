/**
 * Isomorphic entity API (safe for admin code). Server pieces — models,
 * validation middlewares, routes, workflows — are in `./server`.
 */
export { fields } from "./fields"
export {
  defineEntity,
  entityLabel,
  getEntity,
  getEntityModule,
  resetEntities,
} from "./define-entity"
export { defineEntities, type DefineEntitiesOptions, type EntitySet } from "./define-entities"
export {
  foreignKeyName,
  foreignKeys,
  isColumnLink,
  isLink,
  linkColumns,
  isToOne,
  linkKeys,
  ownsForeignKey,
  relationField,
} from "./relations"
export type {
  BatchUpdateDto,
  CreateDto,
  DefineEntityConfig,
  EntityDef,
  EntityExternal,
  EntityLabel,
  EntityDmlSchema,
  EntityModel,
  EntityName,
  EntityQuery,
  EntityRegistry,
  EntityStorage,
  ForeignKeys,
  InferEntity,
  LinkKeys,
  LinkOptions,
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
