/**
 * DML model registry — lazy `ref()` / `define()` / `createModel()` helpers.
 *
 * Breaks circular `const` TDZ in bidirectional DML relationships
 * (e.g. hasMany ↔ belongsTo) by routing model lookups through a
 * string‑keyed registry instead of JavaScript variable references.
 *
 * Usage
 * -----
 * ```ts
 * const Parent = createModel("Parent", ParentSchema, {
 *   relationships: { children: ref("Child") },
 * })
 *
 * const Child  = createModel("Child", ChildSchema, {
 *   relationships: { parent: ref("Parent") },
 * })
 * ```
 *
 * `createModel` derives `modelName` automatically (`snakeCase(name)`)
 * and passes all other options through to `zodSchemaToDml`.
 */

import type { DmlEntity } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { zodSchemaToDml } from "./schema-to-dml"
import type { CreateModelEntity, CreateModelOptions, DmlGenOptions } from "./types"
import { snakeCase } from "lodash"

const registry = new Map<string, DmlEntity<any, any>>()

/**
 * Reference a DML model by registered name.
 *
 * Returns a getter function (compatible with Medusa's `relationships`
 * option) that resolves the model from the internal registry at
 * validation time — bypassing JavaScript's TDZ.
 */
export function ref<T = any>(name: string): () => T {
  return (() => {
    const entity = registry.get(name)
    if (!entity) {
      const registered = [...registry.keys()].sort().join(", ")
      throw new Error(
        `[dml-registry] Model "${name}" not found. ` +
          `Registered models: ${registered || "(none)"}. ` +
          `Use createModel("${name}", ...) before any validation code runs.`,
      )
    }
    return entity as T
  }) as () => T
}

/**
 * Register a DML model and return it unchanged.
 *
 * Throws when a different model is already registered under `name`.
 *
 * The return type matches the input type exactly — no `any` leakage.
 * Prefer `createModel()` over `define()` for new code — it handles
 * registration and derivation of `modelName` in one step.
 */
export function define<T>(name: string, entity: T): T {
  const existing = registry.get(name)
  if (existing && existing !== (entity as unknown)) {
    throw new Error(
      `[dml-registry] Model "${name}" is already registered. ` +
        `Model names must be unique across modules.`,
    )
  }
  registry.set(name, entity as unknown as DmlEntity<any, any>)
  return entity
}

/**
 * Define, register, and return a DML model from a Zod schema.
 *
 * @deprecated Use `defineEntity` from `@repo/framework/entity`, which also
 * derives DTOs and query config and types relations through the registry.
 *
 * Derives `modelName` as `snakeCase(name)` automatically.
 * Pass `tableName` in options for a custom DB table name.
 *
 * ```ts
 * const User = createModel("User", UserSchema, {
 *   relationships: { profile: ref("Profile") },
 *   indexes: [{ on: ["email"], unique: true }],
 * })
 * ```
 */
export function createModel<
  Schema extends z.ZodObject<any>,
  const Options extends CreateModelOptions | undefined,
>(name: string, schema: Schema, options?: Options): CreateModelEntity<Schema, Options> {
  return define(
    name,
    zodSchemaToDml(schema, {
      modelName: snakeCase(name),
      ...options,
    } as DmlGenOptions<Record<string, string>>),
  ) as unknown as CreateModelEntity<Schema, Options>
}

/**
 * Clear all registered models.
 *
 * Useful in test teardown (`afterEach(reset)`) or SSR environments
 * where the module-level registry persists across requests.
 */
export function reset(): void {
  registry.clear()
}
