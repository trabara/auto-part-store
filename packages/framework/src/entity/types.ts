import type { InferEntityType } from "@medusajs/framework/types"
import type { DmlEntity, DMLEntitySchemaBuilder } from "@medusajs/framework/utils"
import type { z } from "@medusajs/framework/zod"
import type { DmlProperty, DmlRelationship } from "../orm/types/inference"
import type { DmlCheck, DmlIndex } from "../orm/types/options"

/* ==========================================================================
 * Registry
 * ========================================================================== */

/**
 * Maps entity names to their definitions. Augment it once per module so
 * relation targets are checked and typed:
 *
 * ```ts
 * declare module "@repo/framework/entity" {
 *   interface EntityRegistry {
 *     Vehicle: typeof Vehicle
 *     VehicleEngine: typeof VehicleEngine
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EntityRegistry {}

/** Registered entity names, or any string before the registry is augmented. */
export type EntityName = [keyof EntityRegistry] extends [never]
  ? string
  : keyof EntityRegistry & string

/** The DML model type of a registered entity (untyped when unregistered). */
export type ModelOf<Name extends string> = Name extends keyof EntityRegistry
  ? EntityModel<EntityRegistry[Name]>
  : DmlEntity<any, any>

/* ==========================================================================
 * Relations
 * ========================================================================== */

export type RelationKind = "belongsTo" | "hasOne" | "hasMany" | "manyToMany"

export type RelationOptions = {
  /** Inverse relation name on the target entity. */
  mappedBy?: string
  /** belongsTo / hasOne: the relation (and its FK) may be null. */
  nullable?: boolean
  searchable?: boolean
  /** hasOne: store the FK on this entity. */
  foreignKey?: boolean
  /** belongsTo / hasOne+foreignKey: FK column name. Defaults to `${key}_id`. */
  foreignKeyName?: string
  /** manyToMany */
  pivotTable?: string
  joinColumn?: string
  inverseJoinColumn?: string
}

/** A declared relation: target entity name, kind and options. */
export type RelationDef<
  Kind extends RelationKind = RelationKind,
  Target extends string = string,
  Options extends RelationOptions = RelationOptions,
> = {
  readonly kind: Kind
  readonly target: Target
  readonly options: Options
}

export type RelationMap = Record<string, RelationDef>

/** Builders handed to `relations: (r) => ({ ... })`. */
export interface RelationBuilder {
  belongsTo<T extends EntityName, const O extends RelationOptions = {}>(
    target: T,
    options?: O,
  ): RelationDef<"belongsTo", T, O>
  hasOne<T extends EntityName, const O extends RelationOptions = {}>(
    target: T,
    options?: O,
  ): RelationDef<"hasOne", T, O>
  hasMany<T extends EntityName, const O extends RelationOptions = {}>(
    target: T,
    options?: O,
  ): RelationDef<"hasMany", T, O>
  manyToMany<T extends EntityName, const O extends RelationOptions = {}>(
    target: T,
    options?: O,
  ): RelationDef<"manyToMany", T, O>
}

/* ==========================================================================
 * Foreign keys
 * ========================================================================== */

/** Whether a relation stores an FK column on this entity. */
type OwnsForeignKey<R> = R extends RelationDef<infer Kind, any, infer O>
  ? Kind extends "belongsTo"
    ? true
    : Kind extends "hasOne"
      ? O extends { foreignKey: true }
        ? true
        : false
      : false
  : false

/** FK column name for relation `K`. */
type ForeignKeyName<K extends string, R> = R extends RelationDef<any, any, infer O>
  ? O extends { foreignKeyName: infer N extends string }
    ? N
    : `${K}_id`
  : never

type IsNullable<R> = R extends RelationDef<any, any, infer O>
  ? O extends { nullable: true }
    ? true
    : false
  : false

/** `{ engine_id: string, parent_id: string | null }` for the owning relations. */
export type ForeignKeys<Rels extends RelationMap> = {
  [K in keyof Rels & string as OwnsForeignKey<Rels[K]> extends true
    ? ForeignKeyName<K, Rels[K]>
    : never]: IsNullable<Rels[K]> extends true ? string | null : string
}

/** Zod shape of the FK columns, used by DTOs and filters. */
export type ForeignKeyShape<Rels extends RelationMap> = {
  [K in keyof ForeignKeys<Rels>]: null extends ForeignKeys<Rels>[K]
    ? z.ZodOptional<z.ZodNullable<z.ZodString>>
    : z.ZodString
}

/* ==========================================================================
 * DML schema inference
 * ========================================================================== */

/** Columns Medusa adds to every model; never declared in the DML schema. */
export type ImplicitKey = "created_at" | "updated_at" | "deleted_at"

type ScalarShape<S extends z.ZodObject<any>> = Omit<S["shape"], ImplicitKey>

type RelationDataType<R> = R extends RelationDef<infer Kind, infer T, any>
  ? Kind extends "belongsTo" | "hasOne"
    ? IsNullable<R> extends true
      ? (() => ModelOf<T>) | null // same shape as Medusa's RelationNullableModifier
      : () => ModelOf<T>
    : () => ModelOf<T>
  : never

type RelationProperty<R> = R extends RelationDef<infer Kind, any, infer O>
  ? DmlRelationship<RelationDataType<R>, Kind> &
      (OwnsForeignKey<R> extends true
        ? { $foreignKey: true } & (O extends { foreignKeyName: infer N extends string }
            ? { $foreignKeyName: N }
            : unknown)
        : unknown)
  : never

/** DML schema of an entity: scalar columns plus relation properties. */
export type EntityDmlSchema<S extends z.ZodObject<any>, Rels extends RelationMap> = {
  [K in keyof ScalarShape<S>]: DmlProperty<z.infer<ScalarShape<S>[K]>>
} & {
  [K in keyof Rels]: RelationProperty<Rels[K]>
}

/* ==========================================================================
 * Entity definition
 * ========================================================================== */

type SnakeChar<C extends string> = C extends Lowercase<C> ? C : `_${Lowercase<C>}`
type SnakeTail<S extends string> = S extends `${infer H}${infer T}`
  ? `${SnakeChar<H>}${SnakeTail<T>}`
  : ""

/** `"VehicleEngine"` → `"vehicle_engine"` (matches lodash for PascalCase names). */
export type SnakeCase<S extends string> = S extends `${infer H}${infer T}`
  ? `${Lowercase<H>}${SnakeTail<T>}`
  : S

/** Keys of the base schema that are server-managed. */
export type ServerManagedKey = "id" | ImplicitKey

type CreateShape<S extends z.ZodObject<any>, Rels extends RelationMap> = Omit<
  S["shape"],
  ServerManagedKey
> &
  ForeignKeyShape<Rels>

export type CreateDto<S extends z.ZodObject<any>, Rels extends RelationMap> = z.ZodObject<
  CreateShape<S, Rels>
>

export type UpdateDto<S extends z.ZodObject<any>, Rels extends RelationMap> = z.ZodObject<{
  [K in keyof CreateShape<S, Rels>]: z.ZodOptional<CreateShape<S, Rels>[K]>
}>

export type BatchUpdateDto<S extends z.ZodObject<any>, Rels extends RelationMap> = z.ZodObject<{
  entities: z.ZodArray<
    z.ZodObject<
      { [K in keyof CreateShape<S, Rels>]: z.ZodOptional<CreateShape<S, Rels>[K]> } & {
        id: z.ZodString
      }
    >
  >
}>

export interface EntityQuery {
  /** Selectable own fields: scalars plus FK columns. */
  readonly fields: readonly string[]
  /** Relation names. */
  readonly relations: readonly string[]
  /**
   * Field paths allowed in `?fields=`: own fields plus relations and their
   * fields, `depth` relations deep (default 2, e.g. `*model.make`).
   * Resolved lazily — every target must be defined.
   */
  allowed(depth?: number): string[]
}

/** Scalar schema plus each relation as an optional nested schema (one level). */
export type WithRelationsSchema<S extends z.ZodObject<any>, Rels extends RelationMap> = z.ZodObject<
  S["shape"] & { [K in keyof Rels]: z.ZodOptional<z.ZodType> }
>

/**
 * A defined entity. An interface (not an alias) on purpose: TypeScript keeps
 * it unexpanded until a member is read, so entities can reference each other
 * through the registry without circular-initializer errors.
 */
export interface EntityDef<
  Name extends string = string,
  S extends z.ZodObject<any> = z.ZodObject<any>,
  Rels extends RelationMap = RelationMap,
> {
  readonly name: Name
  /** snake_case name: table name default, remote-query entity, link key. */
  readonly modelName: SnakeCase<Name>
  /** Scalar fields only — relations live in `relations`. */
  readonly schema: S
  readonly relations: Rels
  readonly display: string
  /** Storage options consumed by `toModels` (server). */
  readonly storage: EntityStorage
  readonly dto: {
    readonly create: CreateDto<S, Rels>
    readonly update: UpdateDto<S, Rels>
    readonly batchUpdate: BatchUpdateDto<S, Rels>
  }
  readonly query: EntityQuery
  /**
   * Response-shaped schema: scalars plus relations as optional nested target
   * schemas. Lazy — every relation target must be defined.
   */
  withRelations(): WithRelationsSchema<S, Rels>
}

export interface EntityStorage {
  readonly tableName?: string
  readonly indexes: readonly (string | DmlIndex)[]
  readonly checks: readonly DmlCheck[]
  readonly cascadeDelete: readonly string[]
}

/**
 * DML model type of an entity, as built by `toModels`. Same schema wrapper as
 * `model.define` (adds created_at / updated_at / deleted_at).
 */
export type EntityModel<E> = E extends EntityDef<infer Name, infer S, infer Rels>
  ? DmlEntity<DMLEntitySchemaBuilder<EntityDmlSchema<S, Rels>>, SnakeCase<Name>>
  : never

/** Row type of an entity (Medusa `InferEntityType` of its model). */
export type InferEntity<E> = InferEntityType<EntityModel<E>>

export interface DefineEntityConfig<S extends z.ZodObject<any>, Rels extends RelationMap> {
  /** Scalar fields. Object / entity-like fields belong in `relations`. */
  schema: S
  relations?: (r: RelationBuilder) => Rels
  tableName?: string
  indexes?: (string | DmlIndex)[]
  checks?: DmlCheck[]
  cascadeDelete?: (keyof Rels & string)[]
  /** Field used as the label in relation pickers. Defaults to "name" if present, else "id". */
  display?: keyof S["shape"] & string
}
