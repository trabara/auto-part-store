/**
 * Runtime validation for `zodSchemaToDml` option keys.
 *
 * Ensures that keys referenced by `flatRelations`, `relationships`,
 * `cascadeDelete`, and `indexes` actually exist in the Zod schema shape.
 * Index keys are validated against the effective schema shape after
 * `flatRelations` remapping (so remapped column names are allowed but
 * the original nested object keys are not).
 */

import { z } from "@medusajs/framework/zod"
import type { DmlGenOptions, RelationshipDef, RelationshipInput } from "../types"
import { getZodShape } from "../../utils"

const SCHEMA_KEY_OPTION_CATEGORIES = ["flatRelations", "relationships", "cascadeDelete"] as const

type UnknownKeyRef = {
  category: string
  key: string
}

function schemaKeys(schema: z.ZodObject<any>): string[] {
  return Object.keys(getZodShape(schema))
}

function isRelationshipMetadata(def: RelationshipInput): def is RelationshipDef {
  return typeof def === "object" && def !== null && "kind" in def && "model" in def
}

function relationshipFkNames(relationships?: Record<string, RelationshipInput>): string[] {
  if (!relationships) return []

  const names: string[] = []
  for (const [key, def] of Object.entries(relationships)) {
    if (!isRelationshipMetadata(def)) continue
    if (def.kind === "belongsTo" || (def.kind === "hasOne" && def.options?.foreignKey)) {
      names.push(def.options?.foreignKeyName ?? `${key}_id`)
    }
  }
  return names
}

function effectiveIndexKeys(
  keys: string[],
  flatRelations?: Record<string, string>,
  relationships?: Record<string, RelationshipInput>,
): string[] {
  const remapped = new Set(flatRelations ? Object.keys(flatRelations) : [])
  const added = [
    ...(flatRelations ? Object.values(flatRelations) : []),
    ...relationshipFkNames(relationships),
  ]
  return [...keys.filter((key) => !remapped.has(key)), ...added]
}

function collectSchemaKeyErrors(keys: string[], options: DmlGenOptions<any>): UnknownKeyRef[] {
  const unknown: UnknownKeyRef[] = []

  for (const category of SCHEMA_KEY_OPTION_CATEGORIES) {
    const value = options[category]
    if (!value) continue

    const entries = Array.isArray(value) ? value : Object.keys(value)
    for (const key of entries) {
      if (!keys.includes(key)) {
        unknown.push({ category, key })
      }
    }
  }

  return unknown
}

function collectRelationshipShapeErrors(
  relationships?: Record<string, RelationshipInput>,
): UnknownKeyRef[] {
  const unknown: UnknownKeyRef[] = []
  if (!relationships) return unknown

  for (const [key, def] of Object.entries(relationships)) {
    if (typeof def === "function") continue
    if (!isRelationshipMetadata(def)) {
      unknown.push({ category: "relationships", key })
      continue
    }
    if (!def.model || typeof def.model !== "function") {
      unknown.push({ category: "relationships.model", key })
    }
  }

  return unknown
}

function collectIndexErrors(
  keys: string[],
  indexes?: (string | { on: string[] })[],
): UnknownKeyRef[] {
  const unknown: UnknownKeyRef[] = []
  if (!indexes) return unknown

  for (const index of indexes) {
    const indexKeys = typeof index === "string" ? [index] : index.on
    for (const key of indexKeys) {
      if (!keys.includes(key)) {
        unknown.push({ category: "indexes", key })
      }
    }
  }

  return unknown
}

function formatError(unknown: UnknownKeyRef[], allowedKeys: string[]): string {
  const refs = unknown.map(({ category, key }) => `${category}.${key}`).join(", ")
  return `[dml-options] Unknown option key(s): ${refs}. Allowed schema keys: ${allowedKeys.join(", ")}.`
}

/**
 * Validate that option keys reference fields that exist in the schema.
 *
 * @param schema - The Zod object schema representing the entity.
 * @param options - The DML generation options to validate.
 * @throws Error when any option key is not present in the schema shape.
 *
 * @example
 * ```ts
 * validateOptionKeys(UserSchema, {
 *   modelName: "User",
 *   flatRelations: { custommer: "customer_id" }, // throws — typo
 * })
 * ```
 */
export function validateOptionKeys(schema: z.ZodObject<any>, options: DmlGenOptions<any>): void {
  const keys = schemaKeys(schema)
  const indexKeys = effectiveIndexKeys(keys, options.flatRelations, options.relationships)

  const unknown = [
    ...collectSchemaKeyErrors(keys, options),
    ...collectRelationshipShapeErrors(options.relationships),
    ...collectIndexErrors(indexKeys, options.indexes),
  ]

  if (unknown.length > 0) {
    throw new Error(formatError(unknown, keys))
  }
}
