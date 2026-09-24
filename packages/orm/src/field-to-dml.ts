/**
 * Single-field Zod → DML conversion.
 *
 * Converts one Zod field into either a DML property definition
 * or a relationship descriptor, depending on the field type.
 */

import { model } from "@medusajs/framework/utils"
import type { DmlEntity } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import type {
  DmlFieldDef,
  DmlPropertyResult,
  RelationshipDef,
  RelationshipKind,
  ZodFieldInfo,
} from "./types"
import {
  typeTag,
  resolveLazy,
  unwrap,
  isOptionalChain,
  getDefaultValue,
  getEnumValues,
  getNativeEnumValues,
  isNativeEnum,
  isLiteralUnion,
  getLiteralUnionValues,
  getObjectShape,
  looksLikeEntity,
  IMPLICIT_PROPERTIES,
} from "@repo/utils"

// =============================================================================
// Value extraction
// =============================================================================

function isLiteralTag(schema: z.ZodTypeAny): boolean {
  const tag = typeTag(schema)
  return tag === "literal" || tag === "ZodLiteral"
}

function getLiteralValue(schema: z.ZodTypeAny): unknown {
  if (!isLiteralTag(schema)) return undefined

  const def = (schema as unknown as { _def?: { value?: unknown; values?: unknown[] } })._def
  if (def?.value !== undefined) return def.value
  if (Array.isArray(def?.values) && def.values.length > 0) return def.values[0]
  return undefined
}

// =============================================================================
// Introspection helpers
// =============================================================================

function scalarFieldDef(
  dmlType: "text" | "boolean" | "number" | "dateTime",
  nullable: boolean,
  defaultValue: unknown,
): DmlFieldDef {
  return defaultValue === undefined
    ? { dmlType, nullable }
    : { dmlType, nullable, default: defaultValue }
}

function enumFieldDef(nullable: boolean, enumValues: string[], defaultValue: unknown): DmlFieldDef {
  return defaultValue === undefined
    ? { dmlType: "enum", nullable, enumValues }
    : { dmlType: "enum", nullable, enumValues, default: defaultValue }
}

function literalDmlType(value: unknown): DmlFieldDef["dmlType"] {
  if (typeof value === "string") return "text"
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"
  return "json"
}

function literalFieldDef(current: z.ZodTypeAny, nullable: boolean): DmlFieldDef {
  const value = getLiteralValue(current)
  return {
    dmlType: literalDmlType(value),
    nullable,
    default: value,
  }
}

function arrayElement(current: z.ZodTypeAny): z.ZodTypeAny | undefined {
  const def = (current as unknown as { _def?: { element?: unknown; type?: unknown } })._def
  return resolveLazy((def?.element ?? def?.type) as z.ZodTypeAny)
}

function arrayFieldInfo(current: z.ZodTypeAny, nullable: boolean): ZodFieldInfo {
  const element = arrayElement(current)
  if (element && typeTag(element) === "object") {
    return {
      fieldDef: null,
      relation: {
        kind: "hasMany",
        target: undefined,
        targetModelName: undefined,
      },
    }
  }
  return {
    fieldDef: { dmlType: "json", nullable },
    relation: { kind: "json" },
  }
}

function objectFieldInfo(
  current: z.ZodTypeAny,
  fieldName: string,
  nullable: boolean,
): ZodFieldInfo {
  const keys = Object.keys(getObjectShape(current))
  if (keys.includes("id")) {
    const targetName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    return {
      fieldDef: null,
      relation: {
        kind: "belongsTo",
        target: targetName,
        targetModelName: targetName,
      },
    }
  }
  return {
    fieldDef: { dmlType: "json", nullable },
    relation: { kind: "json" },
  }
}

// =============================================================================
// Runtime builder helpers
// =============================================================================

function buildTextProperty(nullable: boolean, defaultValue: unknown) {
  const prop =
    defaultValue === undefined ? model.text() : model.text().default(defaultValue as string)
  return nullable ? prop.nullable() : prop
}

function buildNumberProperty(nullable: boolean, defaultValue: unknown) {
  const prop =
    defaultValue === undefined ? model.number() : model.number().default(defaultValue as number)
  return nullable ? prop.nullable() : prop
}

function buildBooleanProperty(nullable: boolean, defaultValue: unknown) {
  const prop =
    defaultValue === undefined ? model.boolean() : model.boolean().default(defaultValue as boolean)
  return nullable ? prop.nullable() : prop
}

function buildDateTimeProperty(nullable: boolean, defaultValue: unknown) {
  const prop =
    defaultValue === undefined ? model.dateTime() : model.dateTime().default(defaultValue as Date)
  return nullable ? prop.nullable() : prop
}

function buildEnumProperty(values: string[], nullable: boolean, defaultValue: unknown) {
  const prop =
    defaultValue === undefined
      ? model.enum(values)
      : model.enum(values).default(defaultValue as string)
  return nullable ? prop.nullable() : prop
}

function buildLiteralProperty(current: z.ZodTypeAny, nullable: boolean) {
  const value = getLiteralValue(current)

  if (typeof value === "string") {
    const prop = model.text().default(value)
    return nullable ? prop.nullable() : prop
  }

  if (typeof value === "number") {
    const prop = model.number().default(value)
    return nullable ? prop.nullable() : prop
  }

  if (typeof value === "boolean") {
    const prop = model.boolean().default(value)
    return nullable ? prop.nullable() : prop
  }

  return nullable ? model.json().nullable() : model.json()
}

function relationshipOptions(
  options?: RelationshipDef["options"],
): Record<string, unknown> | undefined {
  if (!options) return undefined

  const result: Record<string, unknown> = {}
  if (options.mappedBy !== undefined) result.mappedBy = options.mappedBy
  if (options.foreignKey !== undefined) result.foreignKey = options.foreignKey
  if (options.foreignKeyName !== undefined) result.foreignKeyName = options.foreignKeyName
  if (options.nullable !== undefined) result.nullable = options.nullable
  if (options.searchable !== undefined) result.searchable = options.searchable
  if (options.pivotTable !== undefined) result.pivotTable = options.pivotTable
  if (options.joinColumn !== undefined) result.joinColumn = options.joinColumn
  if (options.inverseJoinColumn !== undefined) result.inverseJoinColumn = options.inverseJoinColumn
  if (options.pivotEntity !== undefined) result.pivotEntity = options.pivotEntity
  return Object.keys(result).length > 0 ? result : undefined
}

function applyRelationshipKind(
  kind: RelationshipKind,
  resolver: () => DmlEntity<any, any>,
  options?: Record<string, unknown>,
  nullable?: boolean,
) {
  const prop = (() => {
    switch (kind) {
      case "hasOne":
        return options ? model.hasOne(resolver, options) : model.hasOne(resolver)
      case "hasMany":
        return options ? model.hasMany(resolver, options) : model.hasMany(resolver)
      case "belongsTo":
        return options ? model.belongsTo(resolver, options) : model.belongsTo(resolver)
      case "manyToMany":
        return options ? model.manyToMany(resolver, options) : model.manyToMany(resolver)
    }
  })()

  if (
    nullable &&
    "nullable" in prop &&
    typeof (prop as { nullable?: () => unknown }).nullable === "function"
  ) {
    return (prop as { nullable: () => unknown }).nullable()
  }

  return prop
}

function buildRelationshipProperty(
  def: RelationshipDef | null | undefined,
  defaultKind: RelationshipKind,
  nullable: boolean,
): any | undefined {
  const resolver = def?.model
  if (!resolver) return undefined

  const kind = def.kind ?? defaultKind
  const options = relationshipOptions(def.options)
  return applyRelationshipKind(kind, resolver, options, nullable)
}

function buildArrayProperty(
  current: z.ZodTypeAny,
  fieldName: string,
  nullable: boolean,
  relationships?: Record<string, RelationshipDef | null>,
) {
  const element = arrayElement(current)
  if (element && typeTag(element) === "object") {
    const property = buildRelationshipProperty(relationships?.[fieldName], "hasMany", nullable)
    if (property) return property
  }
  return nullable ? model.json().nullable() : model.json()
}

function buildObjectProperty(
  current: z.ZodTypeAny,
  fieldName: string,
  nullable: boolean,
  relationships?: Record<string, RelationshipDef | null>,
) {
  if (looksLikeEntity(current)) {
    const property = buildRelationshipProperty(relationships?.[fieldName], "belongsTo", nullable)
    if (property) return property
    return nullable ? model.text().nullable() : model.text()
  }
  return nullable ? model.json().nullable() : model.json()
}

// =============================================================================
// Introspection
// =============================================================================

/**
 * Introspect a single Zod field and return its DML type metadata.
 *
 * Pure introspection — no Medusa DML properties are instantiated.
 *
 * @example
 * ```ts
 * zodFieldToDml(z.string().min(1), "name")
 * // → { fieldDef: { dmlType: "text", nullable: false }, relation: null }
 *
 * zodFieldToDml(z.object({ id: z.string() }), "customer")
 * // → { fieldDef: null, relation: { kind: "belongsTo", target: "Customer" } }
 * ```
 */
export function zodFieldToDml(field: z.ZodTypeAny, fieldName: string): ZodFieldInfo {
  const current = unwrap(field)
  const nullable = isOptionalChain(field)
  const t = typeTag(current)
  const defaultValue = getDefaultValue(field)

  if (fieldName === "id" && t === "string") {
    return { fieldDef: { dmlType: "id", nullable: false }, relation: null }
  }

  if (t === "string") {
    return { fieldDef: scalarFieldDef("text", nullable, defaultValue), relation: null }
  }

  if (t === "boolean") {
    return { fieldDef: scalarFieldDef("boolean", nullable, defaultValue), relation: null }
  }

  if (t === "number") {
    return { fieldDef: scalarFieldDef("number", nullable, defaultValue), relation: null }
  }

  if (t === "date") {
    return { fieldDef: scalarFieldDef("dateTime", nullable, defaultValue), relation: null }
  }

  if (isNativeEnum(current)) {
    return {
      fieldDef: enumFieldDef(nullable, getNativeEnumValues(current), defaultValue),
      relation: null,
    }
  }

  if (t === "enum") {
    return {
      fieldDef: enumFieldDef(nullable, getEnumValues(current), defaultValue),
      relation: null,
    }
  }

  if (isLiteralUnion(current)) {
    return {
      fieldDef: enumFieldDef(nullable, getLiteralUnionValues(current), defaultValue),
      relation: null,
    }
  }

  if (isLiteralTag(current)) {
    return { fieldDef: literalFieldDef(current, nullable), relation: null }
  }

  if (t === "array") {
    return arrayFieldInfo(current, nullable)
  }

  if (t === "object") {
    return objectFieldInfo(current, fieldName, nullable)
  }

  if (t === "record") {
    return {
      fieldDef: { dmlType: "json", nullable },
      relation: { kind: "json" },
    }
  }

  return { fieldDef: { dmlType: "json", nullable }, relation: null }
}

// =============================================================================
// Runtime builder
// =============================================================================

/**
 * Build an actual Medusa DML property from a Zod field.
 *
 * Returns `null` for implicit properties (created_at / updated_at / deleted_at)
 * that Medusa auto-manages.
 *
 * @example
 * ```ts
 * buildDmlProperty(z.string(), "email")
 * // → { property: model.text(), dmlName: "email" }
 *
 * buildDmlProperty(z.boolean().default(false), "is_active")
 * // → { property: model.boolean().default(false), dmlName: "is_active" }
 *
 * buildDmlProperty(z.date(), "created_at")
 * // → null  (implicit — Medusa manages it)
 * ```
 */
export function buildDmlProperty(
  field: z.ZodTypeAny,
  fieldName: string,
  relationships?: Record<string, RelationshipDef | null>,
  flatRelations?: Record<string, string>,
): DmlPropertyResult {
  if (IMPLICIT_PROPERTIES.has(fieldName)) {
    return null
  }

  const dmlName = flatRelations?.[fieldName] ?? fieldName
  const current = unwrap(field)
  const nullable = isOptionalChain(field)
  const t = typeTag(current)
  const defaultValue = getDefaultValue(field)

  if (fieldName === "id" && t === "string") {
    return { property: model.id().primaryKey(), dmlName }
  }

  if (flatRelations && fieldName in flatRelations) {
    return { property: buildTextProperty(nullable, defaultValue), dmlName }
  }

  if (t === "string") {
    return { property: buildTextProperty(nullable, defaultValue), dmlName }
  }

  if (t === "boolean") {
    return { property: buildBooleanProperty(nullable, defaultValue), dmlName }
  }

  if (t === "number") {
    return { property: buildNumberProperty(nullable, defaultValue), dmlName }
  }

  if (t === "date") {
    return { property: buildDateTimeProperty(nullable, defaultValue), dmlName }
  }

  if (isNativeEnum(current)) {
    return {
      property: buildEnumProperty(getNativeEnumValues(current), nullable, defaultValue),
      dmlName,
    }
  }

  if (t === "enum") {
    return {
      property: buildEnumProperty(getEnumValues(current), nullable, defaultValue),
      dmlName,
    }
  }

  if (isLiteralUnion(current)) {
    return {
      property: buildEnumProperty(getLiteralUnionValues(current), nullable, defaultValue),
      dmlName,
    }
  }

  if (isLiteralTag(current)) {
    return { property: buildLiteralProperty(current, nullable), dmlName }
  }

  if (t === "array") {
    return {
      property: buildArrayProperty(current, fieldName, nullable, relationships),
      dmlName,
    }
  }

  if (t === "object") {
    return {
      property: buildObjectProperty(current, fieldName, nullable, relationships),
      dmlName,
    }
  }

  if (t === "record") {
    return { property: nullable ? model.json().nullable() : model.json(), dmlName }
  }

  return { property: nullable ? model.json().nullable() : model.json(), dmlName }
}
