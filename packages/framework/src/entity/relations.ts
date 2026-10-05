import type { RelationBuilder, RelationDef, RelationKind, RelationOptions } from "./types"

function relation<K extends RelationKind>(kind: K) {
  return (target: string, options: RelationOptions = {}): RelationDef =>
    Object.freeze({ kind, target, options: Object.freeze({ ...options }) })
}

/** The `r` passed to `relations: (r) => ({ ... })`. */
export const relationBuilder = {
  belongsTo: relation("belongsTo"),
  hasOne: relation("hasOne"),
  hasMany: relation("hasMany"),
  manyToMany: relation("manyToMany"),
  link: relation("link"),
} as unknown as RelationBuilder

/** Whether a relation stores an FK column on its own entity. */
export function ownsForeignKey(rel: RelationDef): boolean {
  return rel.kind === "belongsTo" || (rel.kind === "hasOne" && !!rel.options.foreignKey)
}

export function foreignKeyName(key: string, rel: RelationDef): string {
  return rel.options.foreignKeyName ?? `${key}_id`
}

/** `{ [fkName]: relationKey }` for every relation that owns an FK. */
export function foreignKeys(relations: Record<string, RelationDef>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, rel] of Object.entries(relations)) {
    if (ownsForeignKey(rel)) out.set(foreignKeyName(key, rel), key)
  }
  return out
}

export function isLink(rel: RelationDef): boolean {
  return rel.kind === "link"
}

/** `{ [`${key}_id`]: key }` for every link relation (DTO keys, not columns). */
export function linkKeys(relations: Record<string, RelationDef>): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, rel] of Object.entries(relations)) {
    if (isLink(rel)) out.set(`${key}_id`, key)
  }
  return out
}

/** Relations pointing at one entity: belongsTo, hasOne and links. */
export function isToOne(rel: RelationDef): boolean {
  return rel.kind === "belongsTo" || rel.kind === "hasOne" || rel.kind === "link"
}

/**
 * The DTO / form field that sets a to-one relation: the FK column for
 * belongsTo (and hasOne with foreignKey), `${key}_id` for a link.
 */
export function relationField(key: string, rel: RelationDef): string | undefined {
  if (isLink(rel)) return `${key}_id`
  return ownsForeignKey(rel) ? foreignKeyName(key, rel) : undefined
}

/** Relation kinds that may sit on the other side of `kind` via `mappedBy`. */
export const INVERSE_KINDS: Record<RelationKind, readonly RelationKind[]> = {
  belongsTo: ["hasMany", "hasOne"],
  hasOne: ["belongsTo", "hasOne"],
  hasMany: ["belongsTo"],
  manyToMany: ["manyToMany"],
  link: [],
}
