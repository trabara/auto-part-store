import type { DmlEntity } from "@medusajs/framework/utils"

/** DML property type classification for a single field. */
export type DmlFieldDef = {
  dmlType: "text" | "boolean" | "number" | "dateTime" | "json" | "enum" | "id"
  nullable: boolean
  default?: unknown
  enumValues?: string[]
}

/** Supported Medusa relationship kinds. */
export type RelationshipKind = "hasOne" | "hasMany" | "belongsTo" | "manyToMany"

/** Options configuring a single relationship. */
export type RelationshipOptions = {
  /** Inverse property name on the related entity. */
  mappedBy?: string
  /** Whether the relationship column is nullable. */
  nullable?: boolean
  /** Whether the relationship is searchable. */
  searchable?: boolean
  /** Whether the foreign-key column should be added to this model's table. Only applies to hasOne. */
  foreignKey?: boolean
  /** Custom name for the foreign-key column created by belongsTo. */
  foreignKeyName?: string
  /** Pivot table name for many-to-many relationships. */
  pivotTable?: string
  /** Join column on the owning side of a many-to-many. */
  joinColumn?: string
  /** Inverse join column on the opposite side of a many-to-many. */
  inverseJoinColumn?: string
  /** Pivot entity resolver for many-to-many relationships. */
  pivotEntity?: () => unknown
}

/** Full metadata describing a single relationship. */
export type RelationshipDef = {
  kind: RelationshipKind
  model?: () => any
  target?: string
  targetModelName?: string
  options?: RelationshipOptions
}

/** Input accepted for a relationship declaration. */
export type RelationshipInput = (() => DmlEntity<any, any>) | RelationshipDef

/** Marker for fields that fall back to JSON storage. */
type JsonRelDef = {
  kind: "json"
}

/** DML relationship classification for a single field. */
export type DmlRelDef = RelationshipDef | JsonRelDef

/** Result of introspecting a single Zod field. */
export type ZodFieldInfo = {
  fieldDef: DmlFieldDef | null
  relation: DmlRelDef | null
}

/**
 * Result of building a single DML property at runtime.
 *
 * - `property` — a Medusa DML property (e.g. `model.text().nullable()`).
 * - `dmlName` — the final column name (renamed by `flatRelations` if applicable).
 * - `null` — the field was filtered (e.g. implicit `created_at`).
 */
export type DmlPropertyResult = {
  property: any
  dmlName: string
} | null
