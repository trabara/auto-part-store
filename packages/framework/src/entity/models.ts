import { model } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { createEntityFindParams } from "../http/helpers"
import { buildDmlProperty, buildRelationshipProperty } from "../orm/field-to-dml"
import { define, ref } from "../orm/registry"
import type { EntitySet } from "./define-entities"
import { foreignKeys, isColumnLink, linkColumns } from "./relations"
import { searchPaths } from "./search"
import type { EntityDef, EntityModel, RelationMap } from "./types"

type AnyEntity = EntityDef<any, any, any>

const models = new WeakMap<AnyEntity, unknown>()
const findParamsCache = new WeakMap<AnyEntity, z.ZodObject<any>>()

function buildModel(entity: AnyEntity) {
  if (entity.external) {
    throw new Error(`[toModel] ${entity.name} is external (module "${entity.external.module}"): no model.`)
  }
  const shape = entity.schema.shape as Record<string, z.ZodTypeAny>
  const relations = entity.relations as RelationMap
  const { storage } = entity

  // Own text fields `?q=` searches are searchable for Medusa too (`q` in
  // service list calls); relation paths are searched by the framework only.
  const searchable = new Set(searchPaths(entity).filter((path) => !path.includes(".")))

  const fields: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(shape)) {
    const built = buildDmlProperty(field, key, undefined, undefined, { searchable })
    if (built) fields[built.dmlName] = built.property
  }
  for (const [key, rel] of Object.entries(relations)) {
    if (isColumnLink(rel)) {
      // The target id, indexed; resolved through a read-only Medusa link.
      const column = model.text().index()
      fields[`${key}_id`] = rel.options.nullable ? column.nullable() : column
      continue
    }
    if (rel.kind === "link") continue // table links live in Medusa link tables
    fields[key] = buildRelationshipProperty(
      { kind: rel.kind, model: ref(rel.target), options: rel.options },
      rel.kind,
      rel.options.nullable === true,
    )
  }

  let dml = model.define(storage.tableName ?? entity.modelName, fields as any)
  if (storage.cascadeDelete.length) {
    dml = dml.cascades({ delete: [...storage.cascadeDelete] } as any)
  }
  if (storage.indexes.length) {
    dml = dml.indexes(
      storage.indexes.map((idx) => (typeof idx === "string" ? { on: [idx] } : idx)) as any,
    )
  }
  if (storage.checks.length) {
    dml = dml.checks([...storage.checks])
  }
  return dml
}

/** The DML model of one entity, built and registered on first use. */
export function toModel<E extends AnyEntity>(entity: E): EntityModel<E> {
  let built = models.get(entity)
  if (!built) {
    built = define(entity.name, buildModel(entity))
    models.set(entity, built)
  }
  return built as EntityModel<E>
}

/**
 * DML models for a set of entities, keyed like the set — ready for
 * `MedusaService(toModels(entities))` and for the module's `models/` folder.
 */
export function toModels<E extends Record<string, AnyEntity>>(
  set: EntitySet<E>,
): { [K in keyof E]: EntityModel<E[K]> } {
  return Object.fromEntries(
    Object.entries(set.entities).map(([key, entity]) => [key, toModel(entity)]),
  ) as { [K in keyof E]: EntityModel<E[K]> }
}

/** Find-params schema: pagination, `fields`, `q` and filters (incl. FK columns). */
export function findParams(entity: AnyEntity): z.ZodObject<any> {
  let schema = findParamsCache.get(entity)
  if (!schema) {
    const relations = entity.relations as RelationMap
    const fkColumns = Object.fromEntries(
      [...foreignKeys(relations).keys(), ...linkColumns(relations).keys()].map((k) => [k, z.string()]),
    )
    schema = createEntityFindParams(entity.schema.extend(fkColumns))
    findParamsCache.set(entity, schema)
  }
  return schema
}
