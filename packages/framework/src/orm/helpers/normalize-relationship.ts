import { z } from "@medusajs/framework/zod"
import { getObjectShape, resolveLazy, typeTag, unwrap } from "../../utils"
import type { RelationshipDef, RelationshipInput, RelationshipKind } from "../types"

function isMetadataObject(def: RelationshipInput): def is RelationshipDef {
  return (
    typeof def === "object" &&
    def !== null &&
    "model" in def &&
    typeof def.model === "function" &&
    "kind" in def
  )
}

function isObjectWithId(schema: z.ZodTypeAny): boolean {
  const current = unwrap(schema)
  if (typeTag(current) !== "object") return false
  return Object.keys(getObjectShape(current)).includes("id")
}

function isArrayOfObjects(schema: z.ZodTypeAny): boolean {
  const current = unwrap(schema)
  const def = (current as unknown as { _def?: { element?: unknown } })._def
  if (typeTag(current) !== "array" || !def?.element) return false
  return isObjectWithId(resolveLazy(def.element as z.ZodTypeAny))
}

function inferKind(schema: z.ZodTypeAny | undefined): RelationshipKind {
  if (!schema) return "belongsTo"
  if (isArrayOfObjects(schema)) return "hasMany"
  if (isObjectWithId(schema)) return "belongsTo"
  return "belongsTo"
}

function normalizeFromShorthand(
  resolver: () => any,
  schema: z.ZodTypeAny | undefined,
): RelationshipDef {
  return { kind: inferKind(schema), model: resolver }
}

function normalizeFromMetadata(def: RelationshipDef): RelationshipDef {
  return def
}

/**
 * Convert a relationship declaration into a canonical `RelationshipDef`.
 *
 * Accepts either the legacy `() => Model` shorthand or a metadata object
 * that already includes `kind` and optional `options`. When the shorthand is
 * used with a Zod schema, the kind is inferred from the schema shape:
 *
 * - `z.object({ id: ... })`            → `belongsTo`
 * - `z.array(z.object({ id: ... }))`   → `hasMany`
 *
 * Nullish inputs return `null` so callers can treat them as "no relationship".
 */
export function normalizeRelationship(
  def: RelationshipInput | null | undefined,
  schema?: z.ZodTypeAny,
): RelationshipDef | null {
  if (def == null) return null
  if (isMetadataObject(def)) return normalizeFromMetadata(def)
  return normalizeFromShorthand(def, schema)
}
