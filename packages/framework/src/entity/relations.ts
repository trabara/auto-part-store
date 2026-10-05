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

/** Relation kinds that may sit on the other side of `kind` via `mappedBy`. */
export const INVERSE_KINDS: Record<RelationKind, readonly RelationKind[]> = {
  belongsTo: ["hasMany", "hasOne"],
  hasOne: ["belongsTo", "hasOne"],
  hasMany: ["belongsTo"],
  manyToMany: ["manyToMany"],
}
