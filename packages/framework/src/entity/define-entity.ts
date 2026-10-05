/**
 * Isomorphic entity definitions: Zod and lodash only, so the admin can import
 * them. Server-side realisation (DML models, find params, routes, workflows)
 * lives in `./server`.
 */
import { z } from "@medusajs/framework/zod"
import { snakeCase } from "lodash"
import { getZodFieldInfo, looksLikeEntity } from "../utils/zod-introspect"
import { foreignKeys, relationBuilder } from "./relations"
import type {
  DefineEntityConfig,
  EntityDef,
  EntityQuery,
  RelationDef,
  RelationMap,
} from "./types"

const SERVER_MANAGED_KEYS = ["id", "created_at", "updated_at", "deleted_at"] as const

const entities = new Map<string, EntityDef<any, any, any>>()

/** A defined entity by name, if any. */
export function getEntity(name: string): EntityDef | undefined {
  return entities.get(name)
}

/** Clears defined entities. For tests only (pair with orm `reset()`). */
export function resetEntities(): void {
  entities.clear()
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
  const columns = new Set([...Object.keys(shape), ...foreignKeys(relations).keys()])
  for (const index of config.indexes ?? []) {
    for (const column of typeof index === "string" ? [index] : index.on) {
      if (!columns.has(column)) fail(name, `index column "${column}" does not exist.`)
    }
  }
  for (const key of config.cascadeDelete ?? []) {
    if (!(key in relations)) fail(name, `cascadeDelete "${key}" is not a relation.`)
  }
}

function buildDtos(schema: z.ZodObject<any>, relations: RelationMap) {
  const fkShape: Record<string, z.ZodTypeAny> = {}
  for (const [fk, key] of foreignKeys(relations)) {
    fkShape[fk] = relations[key]!.options.nullable ? z.string().nullish() : z.string()
  }
  const mask = Object.fromEntries(
    SERVER_MANAGED_KEYS.filter((k) => k in schema.shape).map((k) => [k, true as const]),
  )
  const create = schema.omit(mask).extend(fkShape)
  const update = create.partial()
  const batchUpdate = z.object({
    entities: z.array(update.extend({ id: z.string() })),
  })
  return { dto: { create, update, batchUpdate }, fkShape }
}

function buildQuery(
  schema: z.ZodObject<any>,
  relations: RelationMap,
  fkShape: Record<string, z.ZodTypeAny>,
): EntityQuery {
  const fields = [...Object.keys(schema.shape), ...Object.keys(fkShape)]
  const relationNames = Object.keys(relations)

  return {
    fields,
    relations: relationNames,
    allowed(depth = 2) {
      const allowed = new Set<string>()
      const visit = (entity: EntityDef, prefix: string, level: number) => {
        for (const f of entity.query.fields) allowed.add(prefix + f)
        if (level === 0) return
        for (const [key, rel] of Object.entries(entity.relations as RelationMap)) {
          allowed.add(prefix + key)
          visit(requireEntity(rel.target), `${prefix}${key}.`, level - 1)
        }
      }
      for (const f of fields) allowed.add(f)
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
  const { dto, fkShape } = buildDtos(schema, relations)
  const display = config.display ?? ("name" in shape ? "name" : "id")

  const entity = Object.freeze({
    name,
    modelName,
    schema,
    relations,
    display,
    storage: Object.freeze({
      tableName: config.tableName,
      indexes: config.indexes ?? [],
      checks: config.checks ?? [],
      cascadeDelete: config.cascadeDelete ?? [],
    }),
    dto: Object.freeze(dto),
    query: Object.freeze(buildQuery(schema, relations, fkShape)),
    withRelations: buildWithRelations(schema, relations),
  }) as unknown as EntityDef<Name, S, Rels>

  entities.set(name, entity)
  return entity
}
