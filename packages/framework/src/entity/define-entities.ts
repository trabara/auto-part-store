import { snakeCase } from "lodash"
import { getEntity } from "./define-entity"
import { INVERSE_KINDS } from "./relations"
import type { EntityDef, RelationDef } from "./types"

type AnyEntity = EntityDef<any, any, any>

export interface EntitySet<E extends Record<string, AnyEntity>> {
  readonly entities: E
  /** Look up an entity by its URL / remote-query key (`vehicle_engine`). */
  byKey(key: string): E[keyof E] | undefined
}

/**
 * Groups a module's entities and validates their relations once all are
 * defined: every target exists, and every `mappedBy` names a relation on the
 * target that points back with a compatible kind.
 */
export function defineEntities<const E extends Record<string, AnyEntity>>(
  entities: E,
): EntitySet<E> {
  const errors: string[] = []

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

  const byKey = new Map(Object.values(entities).map((e) => [snakeCase(e.name), e]))
  return Object.freeze({
    entities,
    byKey: (key: string) => byKey.get(snakeCase(key)) as E[keyof E] | undefined,
  })
}
