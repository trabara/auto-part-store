import { getZodFieldInfo } from "../utils/zod-introspect"
import { getEntity } from "./define-entity"
import type { EntityDef, RelationMap } from "./types"

type AnyEntity = EntityDef<any, any, any>

/**
 * Whether `path` ends on a text field, reached only through same-module
 * relations (a query filter can't cross a module link).
 */
function isSearchable(entity: AnyEntity, path: string): boolean {
  const segments = path.split(".")
  let current: AnyEntity | undefined = entity
  for (const segment of segments.slice(0, -1)) {
    const rel: RelationMap[string] | undefined = (current!.relations as RelationMap)[segment]
    if (!rel || rel.kind === "link") return false
    current = getEntity(rel.target)
    if (!current) return false
  }
  const field = (current!.schema.shape as Record<string, any>)[segments.at(-1)!]
  return !!field && getZodFieldInfo(field).baseType === "string"
}

/** Paths `?q=` searches: the entity's `search`, else its label's text fields. */
export function searchPaths(entity: AnyEntity): string[] {
  return (entity.search ?? entity.label.fields).filter((path) => isSearchable(entity, path))
}

const nested = (path: string, condition: unknown): Record<string, unknown> =>
  path
    .split(".")
    .reverse()
    .reduce<unknown>((inner, segment) => ({ [segment]: inner }), condition) as Record<string, unknown>

/**
 * Query filter for `q`: every word must match (case-insensitively) one of the
 * search paths. Undefined when there is nothing to search.
 */
export function searchFilter(entity: AnyEntity, q: string | undefined): Record<string, unknown> | undefined {
  const words = (q ?? "").trim().split(/\s+/).filter(Boolean)
  const paths = searchPaths(entity)
  if (!words.length || !paths.length) return undefined
  const escape = (w: string) => w.replace(/[%_\\]/g, (c) => `\\${c}`)
  const perWord = words.map((word) => ({
    $or: paths.map((path) => nested(path, { $ilike: `%${escape(word)}%` })),
  }))
  return perWord.length === 1 ? perWord[0] : { $and: perWord }
}
