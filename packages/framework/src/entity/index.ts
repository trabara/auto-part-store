/**
 * Isomorphic entity API (safe for admin code). Server pieces — models,
 * validation middlewares, routes, workflows — are in `./server`.
 */
export { fields } from "./fields"
export {
  defineEntity,
  defaultLabelContext,
  entityLabel,
  withDerived,
  getEntity,
  getEntityModule,
  getEntityUrl,
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
  DerivedField,
  EntityExternal,
  EntityMessages,
  EntityLabel,
  LabelContext,
  UniqueMessage,
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
