import type { PropertyType, RelationshipType, RelationshipTypes } from "@medusajs/framework/types"
import type { DmlEntity } from "@medusajs/framework/utils"
import type { z } from "@medusajs/framework/zod"
import type { CreateModelOptions } from "./options"
import type { RelationshipKind } from "./fields"

/** Supported relationship kinds — mirrored from ./fields to keep type file self-contained. */
type RelationshipKindInternal = "hasOne" | "hasMany" | "belongsTo" | "manyToMany"

/** Minimal relationship metadata consumed by type inference. */
type RelationshipMetadata = {
  kind: RelationshipKindInternal
  model: () => DmlEntity<any, any>
  options?: { nullable?: boolean; foreignKey?: boolean; foreignKeyName?: string } & Record<
    string,
    unknown
  >
}

/**
 * Scalar DML property used only for static inference.
 *
 * This is a thin alias over Medusa's `PropertyType<T>` so that inferred
 * schemas satisfy `DMLSchema` without leaking custom type shapes.
 */
export type DmlProperty<T = unknown> = PropertyType<T>

/**
 * Relationship DML property used only for static inference.
 *
 * Structurally compatible with Medusa's `RelationshipType<T>` but with the
 * relationship `type` narrowed to the concrete kind.
 */
export type DmlRelationship<
  T = unknown,
  Kind extends RelationshipTypes = RelationshipTypes,
> = RelationshipType<T> & {
  type: Kind
  $foreignKey?: true
  $foreignKeyName?: string
}

/** Detects the empty default relation map returned by extract helpers. */
type IsEmptyRelationMap<T> = T extends Record<string, never> ? true : false

/** Maps our relationship kind names to Medusa's `RelationshipTypes`. */
type MapRelationshipKind<Kind extends RelationshipKindInternal> = Kind extends "hasOne"
  ? "hasOne"
  : Kind extends "hasMany"
    ? "hasMany"
    : Kind extends "belongsTo"
      ? "belongsTo"
      : Kind extends "manyToMany"
        ? "manyToMany"
        : never

/** Returns true when a relationship is marked nullable in its options. */
type IsRelationshipOptional<Rel> = Rel extends { options: { nullable: true } } ? true : false

/** Returns true when a relationship kind can carry a local foreign key. */
type HasLocalForeignKey<Kind extends RelationshipKindInternal> = Kind extends "belongsTo" | "hasOne"
  ? true
  : false

/** Infers the resolver type for a relationship's `$dataType`. */
type InferRelationshipDataType<Rel, Kind extends RelationshipKindInternal> = Rel extends {
  model: () => infer Target
}
  ? Target extends DmlEntity<any, any>
    ? HasLocalForeignKey<Kind> extends true
      ? IsRelationshipOptional<Rel> extends true
        ? () => Target | null
        : () => Target
      : () => Target
    : Target
  : never

/** Remaps a schema key through the flatRelations map, if one is present. */
type RemapKey<K, FlatRelations> =
  IsEmptyRelationMap<FlatRelations> extends true
    ? K
    : K extends keyof FlatRelations
      ? FlatRelations[K]
      : K

/** Infers the foreign-key markers for a relationship, if it owns a local FK. */
type InferForeignKeyMarkers<
  Kind extends RelationshipKindInternal,
  Rel,
  K extends string,
  FlatRelations,
> =
  IsEmptyRelationMap<FlatRelations> extends false
    ? K extends keyof FlatRelations
      ? Record<string, never>
      : Kind extends "belongsTo"
        ? { $foreignKey: true }
        : Kind extends "hasOne"
          ? Rel extends { options: { foreignKey: true } }
            ? { $foreignKey: true }
            : Record<string, never>
          : Record<string, never>
    : Kind extends "belongsTo"
      ? { $foreignKey: true }
      : Kind extends "hasOne"
        ? Rel extends { options: { foreignKey: true } }
          ? { $foreignKey: true }
          : Record<string, never>
        : Record<string, never>

/** Infers the DML property type for a relationship key or falls back to scalar inference. */
type InferRelationshipOrScalar<K extends keyof Shape, Shape, Relationships, FlatRelations> =
  IsEmptyRelationMap<Relationships> extends false
    ? K extends keyof Relationships
      ? Relationships[K] extends { kind: infer Kind extends RelationshipKindInternal }
        ? DmlRelationship<
            InferRelationshipDataType<Relationships[K], Kind>,
            MapRelationshipKind<Kind>
          > &
            InferForeignKeyMarkers<Kind, Relationships[K], K & string, FlatRelations>
        : DmlProperty<z.infer<Shape[K]>>
      : DmlProperty<z.infer<Shape[K]>>
    : DmlProperty<z.infer<Shape[K]>>

/** Infers the final DML property type for a single schema key. */
type InferPropertyValue<K extends keyof Shape, Shape, FlatRelations, Relationships> =
  IsEmptyRelationMap<FlatRelations> extends false
    ? K extends keyof FlatRelations
      ? DmlProperty<string>
      : InferRelationshipOrScalar<K, Shape, Relationships, FlatRelations>
    : InferRelationshipOrScalar<K, Shape, Relationships, FlatRelations>

/**
 * Infers the local foreign-key columns created by belongsTo and hasOne
 * relationships. A relationship declared in `flatRelations` is excluded because
 * its key is already remapped to the FK column.
 */
/**
 * Derived DML schema shape — keys remapped by `flatRelations`, values inferred
 * from the source Zod schema shape, and foreign-key columns added for local
 * belongsTo / hasOne relationships.
 *
 * Relationship keys are represented as `DmlRelationship<() => TargetEntity, Kind>`
 * so that circular references do not expand infinitely during schema construction.
 * Medusa's `InferEntityType` expands these resolvers when the entity type is
 * consumed.
 *
 * @internal
 */
export type InferDmlSchema<
  Schema extends z.ZodObject<any>,
  FlatRelations extends Record<string, string> = Record<string, never>,
  Relationships extends Record<string, RelationshipMetadata> = Record<string, never>,
> =
  Schema extends z.ZodObject<infer Shape>
    ? {
        [K in keyof Shape as RemapKey<K, FlatRelations>]: InferPropertyValue<
          K,
          Shape,
          FlatRelations,
          Relationships
        >
      }
    : never

/**
 * Extract the `flatRelations` map from a `createModel` options type,
 * falling back to an empty map when absent.
 */
export type ExtractFlatRelations<Options> = Options extends { flatRelations: infer F }
  ? F extends Record<string, string>
    ? F
    : Record<string, never>
  : Record<string, never>

/**
 * Extract the `relationships` metadata map from a `createModel` options type,
 * falling back to an empty map when absent.
 */
export type ExtractRelationships<Options> = Options extends { relationships: infer R }
  ? R extends Record<string, RelationshipMetadata>
    ? R
    : Record<string, never>
  : Record<string, never>

/**
 * Full inferred return type of `createModel`.
 */
export type CreateModelEntity<
  Schema extends z.ZodObject<any>,
  Options extends CreateModelOptions | undefined,
> = DmlEntity<
  InferDmlSchema<Schema, ExtractFlatRelations<Options>, ExtractRelationships<Options>>,
  string
>
