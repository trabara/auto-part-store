/**
 * Schema-level Zod → DML conversion.
 *
 * Iterates over a Zod object schema's shape and converts each field
 * to the corresponding Medusa DML property, then returns a fully
 * configured DmlEntity (with cascades and indexes applied).
 */

import { model, DmlEntity } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import type { DmlGenOptions, InferDmlSchema, RelationshipDef, RelationshipInput } from "./types"
import { buildDmlProperty } from "./field-to-dml"
import { validateOptionKeys } from "./validation/option-keys"
import { snakeCase } from "@repo/utils"
import { normalizeRelationship } from "./helpers/normalize-relationship"

/**
 * Convert a complete Zod object schema into a Medusa DML entity.
 *
 * Iterates over every field in the schema, builds the corresponding
 * DML property, then applies cascades and indexes.
 *
 * @param schema - The Zod object schema representing the entity.
 * @param options - Configuration for the DML entity (relationships,
 *   flatRelations, indexes, cascadeDelete, etc.).
 * @returns A fully configured Medusa DmlEntity.
 *
 * @example
 * ```ts
 * const UserSchema = z.object({
 *   id: z.string(),
 *   email: z.string().email(),
 *   profile: z.object({ id: z.string() }),
 * })
 *
 * const User = zodSchemaToDml(UserSchema, {
 *   modelName: "user",
 *   relationships: { profile: () => Profile },
 *   indexes: [{ on: ["email"], unique: true }],
 * })
 * ```
 */
function getSchemaShape(schema: z.ZodObject<any>): Record<string, z.ZodTypeAny> {
  return (schema as any).shape ?? (schema._def as any).shape ?? {}
}

function normalizeRelationships(
  schema: z.ZodObject<any>,
  relationships?: Record<string, RelationshipInput>,
): Record<string, RelationshipDef | null> {
  if (!relationships) return {}

  const shape = getSchemaShape(schema)
  const normalized: Record<string, RelationshipDef | null> = {}
  for (const [key, def] of Object.entries(relationships)) {
    normalized[key] = normalizeRelationship(def, shape[key])
  }
  return normalized
}

export function zodSchemaToDml<
  Schema extends z.ZodObject<any>,
  FlatRelations extends Record<string, string> = Record<string, never>,
>(
  schema: Schema,
  options: DmlGenOptions<FlatRelations>,
): DmlEntity<InferDmlSchema<Schema, FlatRelations>, string> {
  validateOptionKeys(schema, options)

  const shape = getSchemaShape(schema)
  const tableName = options.tableName ?? snakeCase(options.modelName)
  const relationships = normalizeRelationships(schema, options.relationships)

  const fields: Record<string, any> = {}
  for (const [key, field] of Object.entries(shape)) {
    const info = buildDmlProperty(field as z.ZodTypeAny, key, relationships, options.flatRelations)
    if (info) {
      fields[info.dmlName] = info.property
    }
  }

  let entity = model.define(tableName, fields)

  if (options.cascadeDelete && options.cascadeDelete.length > 0) {
    entity = entity.cascades({ delete: options.cascadeDelete })
  }

  if (options.indexes && options.indexes.length > 0) {
    entity = entity.indexes(
      options.indexes.map((idx) => (typeof idx === "string" ? { on: [idx] } : idx)),
    )
  }

  return entity as unknown as DmlEntity<InferDmlSchema<Schema, FlatRelations>, string>
}
