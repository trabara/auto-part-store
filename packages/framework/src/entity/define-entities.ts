import { snakeCase } from "lodash"
import { getEntity, setEntityModule } from "./define-entity"
import { INVERSE_KINDS, isLink } from "./relations"
import type { EntityDef, RelationDef } from "./types"

type AnyEntity = EntityDef<any, any, any>

export interface DefineEntitiesOptions {
  /**
   * Medusa module key of these entities (e.g. "vehicle"). Database relations
   * must stay inside the set; relations to other modules use `r.link(...)`.
   */
  module?: string
}

export interface EntitySet<E extends Record<string, AnyEntity>> {
  readonly entities: E
  readonly module?: string
  /** Look up an entity by its URL / remote-query key (`vehicle_engine`). */
  byKey(key: string): E[keyof E] | undefined
}

/**
 * Groups a module's entities and validates their relations once all are
 * defined: every target exists, every `mappedBy` names a relation on the
 * target that points back with a compatible kind, and (with `module`)
 * database relations stay inside the module while links leave it.
 */
export function defineEntities<const E extends Record<string, AnyEntity>>(
  entities: E,
  options: DefineEntitiesOptions = {},
): EntitySet<E> {
  const errors: string[] = []
  const { module } = options
  const members = new Set(Object.values(entities).map((e) => e.name))

  for (const [key, entity] of Object.entries(entities)) {
    if (key !== entity.name) {
      errors.push(`key "${key}" must match the entity name "${entity.name}".`)
    }
    for (const [relKey, rel] of Object.entries(entity.relations as Record<string, RelationDef>)) {
      const where = `${entity.name}.${relKey}`
      const target = getEntity(rel.target)
      if (!target) {
        errors.push(`${where}: target "${rel.target}" is not defined.`)
        continue
      }
      if (isLink(rel)) {
        if (module && members.has(rel.target)) {
          errors.push(
            `${where}: "${rel.target}" is in the same module; use a database relation (r.belongsTo) instead of r.link.`,
          )
        }
        if (relKey !== target.modelName) {
          errors.push(
            `${where}: a link to "${rel.target}" must be named "${target.modelName}" (the alias Medusa's query uses through the link).`,
          )
        }
        continue
      }
      if (module && !members.has(rel.target)) {
        errors.push(
          `${where}: "${rel.target}" is not in module "${module}"; use r.link("${rel.target}") for entities in another module.`,
        )
        continue
      }
      const mappedBy = rel.options.mappedBy
      if (!mappedBy) continue
      const inverse = target.relations[mappedBy]
      if (!inverse) {
        errors.push(`${where}: mappedBy "${mappedBy}" is not a relation of "${rel.target}".`)
      } else if (inverse.target !== entity.name) {
        errors.push(
          `${where}: "${rel.target}.${mappedBy}" points to "${inverse.target}", not "${entity.name}".`,
        )
      } else if (!INVERSE_KINDS[rel.kind].includes(inverse.kind)) {
        errors.push(
          `${where}: ${rel.kind} cannot be mapped by ${inverse.kind} "${rel.target}.${mappedBy}".`,
        )
      }
    }
  }

  if (errors.length) {
    throw new Error(`[defineEntities]\n  ${errors.join("\n  ")}`)
  }
  if (module) {
    for (const entity of Object.values(entities)) setEntityModule(entity.name, module)
  }

  const byKey = new Map(Object.values(entities).map((e) => [snakeCase(e.name), e]))
  return Object.freeze({
    entities,
    module,
    byKey: (key: string) => byKey.get(snakeCase(key)) as E[keyof E] | undefined,
  })
}
