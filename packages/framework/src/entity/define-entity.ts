/**
 * Isomorphic entity definitions: Zod and lodash only, so the admin can import
 * them. Server-side realisation (DML models, find params, routes, workflows)
 * lives in `./server`.
 */
import { z } from "@medusajs/framework/zod"
import { snakeCase } from "lodash"
import { getZodFieldInfo, looksLikeEntity } from "../utils/zod-introspect"
import { foreignKeys, linkColumns, linkKeys, relationBuilder } from "./relations"
import type {
  DefineEntityConfig,
  EntityDef,
  EntityLabel,
  EntityQuery,
  RelationDef,
  RelationMap,
} from "./types"

const SERVER_MANAGED_KEYS = ["id", "created_at", "updated_at", "deleted_at"] as const

const entities = new Map<string, EntityDef<any, any, any>>()
const entityModules = new Map<string, string>()

/** A defined entity by name, if any. */
export function getEntity(name: string): EntityDef | undefined {
  return entities.get(name)
}

/** The Medusa module key an entity belongs to (set by `defineEntities`). */
export function getEntityModule(name: string): string | undefined {
  return entityModules.get(name)
}

/** @internal Records an entity's module; called by `defineEntities`. */
export function setEntityModule(name: string, module: string): void {
  const current = entityModules.get(name)
  if (current && current !== module) {
    throw new Error(
      `[defineEntities] ${name} is already in module "${current}", not "${module}".`,
    )
  }
  entityModules.set(name, module)
}

/** Clears defined entities. For tests only (pair with orm `reset()`). */
export function resetEntities(): void {
  entities.clear()
  entityModules.clear()
}

function requireEntity(name: string): EntityDef {
  const entity = entities.get(name)
  if (!entity) throw new Error(`[defineEntity] relation target "${name}" is not defined.`)
  return entity
}

function buildWithRelations(schema: z.ZodObject<any>, relations: RelationMap) {
  let cached: z.ZodObject<any> | undefined
  return () => {
    if (cached) return cached
    const extra: Record<string, z.ZodTypeAny> = {}
    for (const [key, rel] of Object.entries(relations)) {
      const target = requireEntity(rel.target).schema
      const many = rel.kind === "hasMany" || rel.kind === "manyToMany"
      extra[key] = (many ? z.array(target) : rel.options.nullable ? target.nullable() : target).optional()
    }
    return (cached = schema.extend(extra))
  }
}

function fail(name: string, message: string): never {
  throw new Error(`[defineEntity] ${name}: ${message}`)
}

function validateShape(name: string, shape: Record<string, z.ZodTypeAny>, relations: RelationMap) {
  for (const [key, field] of Object.entries(shape)) {
    const info = getZodFieldInfo(field)
    const element = info.arrayElementInfo?.unwrapped
    if (looksLikeEntity(info.unwrapped) || (element && looksLikeEntity(element))) {
      fail(name, `schema field "${key}" looks like a relation; declare it in \`relations\` instead.`)
    }
    if (key in relations) {
      fail(name, `"${key}" is declared both as a schema field and as a relation.`)
    }
  }
}

function validateStorage(
  name: string,
  shape: Record<string, z.ZodTypeAny>,
  relations: RelationMap,
  config: DefineEntityConfig<any, any>,
) {
  const columns = new Set([
    ...Object.keys(shape),
    ...foreignKeys(relations).keys(),
    ...linkColumns(relations).keys(),
  ])
  for (const index of config.indexes ?? []) {
    for (const column of typeof index === "string" ? [index] : index.on) {
      if (!columns.has(column)) fail(name, `index column "${column}" does not exist.`)
    }
  }
  for (const { on } of config.messages?.unique ?? []) {
    for (const column of on) {
      if (!columns.has(column)) fail(name, `messages.unique column "${column}" does not exist.`)
    }
  }
  for (const key of config.cascadeDelete ?? []) {
    if (!(key in relations)) fail(name, `cascadeDelete "${key}" is not a relation.`)
  }
}

/** An id field: never empty ("" would reach the ORM as a relation id). */
const idField = (nullable: boolean | undefined) => {
  const id = z.string().min(1, "Required")
  return nullable ? id.nullish() : id
}

function buildDtos(schema: z.ZodObject<any>, relations: RelationMap) {
  const fkShape: Record<string, z.ZodTypeAny> = {}
  for (const [fk, key] of foreignKeys(relations)) {
    fkShape[fk] = idField(relations[key]!.options.nullable)
  }
  // Link keys set the linked entity on create/update; they are not columns.
  const linkShape: Record<string, z.ZodTypeAny> = {}
  for (const [field, key] of linkKeys(relations)) {
    linkShape[field] = idField(relations[key]!.options.nullable)
  }
  const mask = Object.fromEntries(
    SERVER_MANAGED_KEYS.filter((k) => k in schema.shape).map((k) => [k, true as const]),
  )
  const create = schema.omit(mask).extend(fkShape).extend(linkShape)
  const update = create.partial()
  const batchUpdate = z.object({
    entities: z.array(update.extend({ id: z.string() })),
  })
  // FK and column-link columns: selectable and filterable like scalars.
  const columnShape = { ...fkShape }
  for (const field of linkColumns(relations).keys()) columnShape[field] = linkShape[field]!
  return { dto: { create, update, batchUpdate }, columnShape }
}

function buildLabel(
  name: string,
  shape: Record<string, z.ZodTypeAny>,
  relations: RelationMap,
  display: string,
  config: DefineEntityConfig<any, any>["label"],
  external: boolean,
): EntityLabel {
  if (!config) {
    return Object.freeze({
      fields: Object.freeze([display]),
      format: (row: any) => (row?.[display] == null ? "" : String(row[display])),
    })
  }
  // External schemas describe only the displayed fields: paths aren't checked.
  for (const path of external ? [] : config.fields) {
    const [root, ...rest] = path.split(".")
    const ok = rest.length ? root! in relations : root! in shape
    if (!ok) fail(name, `label field "${path}" must be a field or start with a relation.`)
  }
  return Object.freeze({ fields: Object.freeze([...config.fields]), format: config.format })
}

/** A record's label (see `label` in `defineEntity`), falling back to its id. */
export function entityLabel(entity: EntityDef<any, any, any>, row: Record<string, any> | null | undefined): string {
  if (!row) return ""
  let label = ""
  try {
    label = entity.label.format(row)
  } catch {
    // Label fields not fetched: fall back to the id.
  }
  return label || (row.id == null ? "" : String(row.id))
}

function buildQuery(
  schema: z.ZodObject<any>,
  relations: RelationMap,
  columnShape: Record<string, z.ZodTypeAny>,
  label: EntityLabel,
): EntityQuery {
  const fields = [...Object.keys(schema.shape), ...Object.keys(columnShape)]
  const relationNames = Object.keys(relations)

  return {
    fields,
    relations: relationNames,
    allowed(depth = 2) {
      const allowed = new Set<string>()
      // Related records' label fields are always allowed, past `depth` too,
      // so a relation can be shown by its label (`vehicle.model.make.name`).
      const addLabels = (rels: RelationMap, prefix: string) => {
        for (const [key, rel] of Object.entries(rels)) {
          for (const f of requireEntity(rel.target).label.fields) allowed.add(`${prefix}${key}.${f}`)
        }
      }
      const visit = (entity: EntityDef, prefix: string, level: number) => {
        for (const f of entity.query.fields) allowed.add(prefix + f)
        addLabels(entity.relations as RelationMap, prefix)
        if (level === 0) return
        for (const [key, rel] of Object.entries(entity.relations as RelationMap)) {
          allowed.add(prefix + key)
          visit(requireEntity(rel.target), `${prefix}${key}.`, level - 1)
        }
      }
      for (const f of fields) allowed.add(f)
      for (const f of label.fields) allowed.add(f)
      addLabels(relations, "")
      for (const [key, rel] of Object.entries(relations)) {
        allowed.add(key)
        visit(requireEntity(rel.target), `${key}.`, depth - 1)
      }
      return [...allowed]
    },
  }
}

/**
 * Defines an entity from a scalar Zod schema plus declared relations, and
 * derives its DTOs and query config. Build DML models with `toModels` from
 * `@repo/framework/entity/server`.
 *
 * ```ts
 * export const VehicleEngine = defineEntity("VehicleEngine", {
 *   schema: BaseSchema.extend({ power: z.number(), name: z.string().optional() }),
 *   relations: (r) => ({ vehicles: r.hasMany("Vehicle", { mappedBy: "engine" }) }),
 *   indexes: [{ on: ["power"] }],
 * })
 * ```
 */
export function defineEntity<
  const Name extends string,
  S extends z.ZodObject<any>,
  Rels extends RelationMap = {},
>(name: Name, config: DefineEntityConfig<S, Rels>): EntityDef<Name, S, Rels> {
  if (entities.has(name)) fail(name, "an entity with this name is already defined.")

  const schema = config.schema
  const shape = schema.shape as Record<string, z.ZodTypeAny>
  const relations = Object.freeze(
    (config.relations?.(relationBuilder) ?? {}) as Record<string, RelationDef>,
  ) as Rels
  validateShape(name, shape, relations)
  validateStorage(name, shape, relations, config)

  const modelName = snakeCase(name)
  const { dto, columnShape } = buildDtos(schema, relations)
  const display = config.display ?? ("name" in shape ? "name" : "id")
  const label = buildLabel(name, shape, relations, display, config.label, !!config.external)

  const entity = Object.freeze({
    name,
    modelName,
    schema,
    relations,
    display,
    label,
    storage: Object.freeze({
      tableName: config.tableName,
      indexes: config.indexes ?? [],
      checks: config.checks ?? [],
      cascadeDelete: config.cascadeDelete ?? [],
    }),
    dto: Object.freeze(dto),
    query: Object.freeze(buildQuery(schema, relations, columnShape, label)),
    external: config.external ? Object.freeze({ ...config.external }) : undefined,
    messages: Object.freeze({
      unique: Object.freeze((config.messages?.unique ?? []).map((m) => Object.freeze({ ...m, on: [...m.on] }))),
    }),
    withRelations: buildWithRelations(schema, relations),
  }) as unknown as EntityDef<Name, S, Rels>

  entities.set(name, entity)
  if (config.external) setEntityModule(name, config.external.module)
  return entity
}
