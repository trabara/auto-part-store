import type { RelationshipInput } from "./fields"

/** A DML index definition. */
export type DmlIndex = { on: string[]; unique?: boolean; where?: string }

/**
 * Options passed to `zodSchemaToDml`.
 *
 * @typeParam FlatRelations - Map of field names → flat column names
 *   for cross-module FK references.
 */
export type DmlGenOptions<FlatRelations extends Record<string, string> = Record<string, string>> = {
  modelName: string
  tableName?: string
  indexes?: (string | DmlIndex)[]
  cascadeDelete?: string[]
  relationships?: Record<string, RelationshipInput>
  flatRelations?: FlatRelations
}

/**
 * Options accepted by `createModel`.
 *
 * Same as `DmlGenOptions` minus `modelName`, which `createModel`
 * derives automatically as `snakeCase(name)`. Used with a `const`
 * type parameter at the call site so literal `flatRelations` maps
 * flow into the inferred entity type.
 */
export type CreateModelOptions = Omit<DmlGenOptions, "modelName">
