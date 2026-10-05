/**
 * Zod type introspection helpers.
 *
 * Pure Zod-traversal utilities — no framework dependency beyond
 * `@medusajs/framework/zod`. All discrimination uses Zod v4 `_def.type`
 * (with v3 `typeName` fallback) so these helpers remain robust across
 * package boundaries.
 */

import { z } from "zod"

// =============================================================================
// Shared types
// =============================================================================

/**
 * Base type for detected schema fields.
 */
export type SchemaFieldBaseType =
  "string" | "number" | "boolean" | "enum" | "array" | "date" | "object" | "unknown"

/**
 * Information extracted from a single Zod schema field.
 */
export interface SchemaFieldInfo {
  /** The base Zod type (string, number, boolean, enum, array, etc.). */
  baseType: SchemaFieldBaseType
  /** Whether the field is optional (z.optional() or nullable). */
  isOptional: boolean
  /** Whether the field has .email() validation. */
  isEmail: boolean
  /** For enum types: the possible values. */
  enumValues?: string[]
  /** For array fields: info about the element type. */
  arrayElementInfo?: SchemaFieldInfo
  /** The unwrapped Zod type (after removing effects and optionals). */
  unwrapped: z.ZodTypeAny
}

// Internal shorthand for Zod's private `_def` shape. We intentionally use
// `unknown` + a cast because Zod does not expose these internals as a stable
// public API, and the existing project introspection code follows this same
// pattern.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodDef = any

// =============================================================================
// Type tag extraction
// =============================================================================

/**
 * Return the Zod `_def.type` tag (with v3 compat fallback via `typeName`).
 *
 * @example
 * ```ts
 * typeTag(z.string())           // → "string"
 * typeTag(z.string().optional()) // → "optional"
 * typeTag(z.lazy(() => schema))  // → "lazy"
 * ```
 */
export function typeTag(schema: z.ZodTypeAny | undefined): string {
  if (!schema) return ""
  const def = (schema as unknown as { _def?: ZodDef })._def
  if (!def) return ""
  return def.type ?? def.typeName ?? ""
}

// =============================================================================
// Lazy resolution
// =============================================================================

const MAX_LAZY_DEPTH = 100

function resolveLazyInternal(
  schema: z.ZodTypeAny,
  visited: WeakSet<object>,
  depth: number,
): z.ZodTypeAny {
  const def = (schema as unknown as { _def?: ZodDef })._def
  if (typeTag(schema) !== "lazy" || !def || typeof def.getter !== "function") {
    return schema
  }
  if (depth >= MAX_LAZY_DEPTH) return schema
  if (visited.has(schema as object)) return schema
  visited.add(schema as object)
  return resolveLazyInternal(def.getter(), visited, depth + 1)
}

/** Recursively resolve `z.lazy()` wrappers. */
export function resolveLazy(schema: z.ZodTypeAny): z.ZodTypeAny {
  return resolveLazyInternal(schema, new WeakSet(), 0)
}

function resolveLazyIfPresent(schema: z.ZodTypeAny | undefined): z.ZodTypeAny | undefined {
  if (!schema) return schema
  return resolveLazy(schema)
}

// =============================================================================
// Wrapper unwrapping
// =============================================================================

const WRAPPER_TAGS = new Set([
  "optional",
  "nullable",
  "default",
  "effects",
  "pipe",
  "pipeline",
  "transform",
])

function unionOptions(schema: z.ZodTypeAny): z.ZodTypeAny[] {
  const def = (schema as unknown as { _def: ZodDef })._def
  return (def.options ?? []) as z.ZodTypeAny[]
}

function unwrapUnion(schema: z.ZodTypeAny): z.ZodTypeAny {
  for (const option of unionOptions(schema)) {
    const resolved = unwrap(option)
    if (typeTag(resolved) !== "literal") return resolved
  }
  return schema
}

// Maximum recursion depth for `unwrap` to prevent infinite loops in circular
// or degenerately nested schemas. Matches the previous 20-iteration guard.
const MAX_UNWRAP_DEPTH = 20

function unwrapWrapper(schema: z.ZodTypeAny): z.ZodTypeAny | undefined {
  const tag = typeTag(schema)
  const def = (schema as unknown as { _def: ZodDef })._def

  if (tag === "optional" || tag === "nullable" || tag === "default") {
    return resolveLazyIfPresent(def.innerType)
  }

  if (tag === "effects") {
    return resolveLazyIfPresent(def.schema ?? def.innerType)
  }

  if (tag === "pipe" || tag === "pipeline") {
    // Prefer the validated output side of a pipe, but fall back to the
    // input side when the output is an unresolvable transform.
    const outSchema = resolveLazyIfPresent(def.out)
    if (outSchema && typeTag(outSchema) !== "transform") {
      return outSchema
    }
    return resolveLazyIfPresent(def.in)
  }

  if (tag === "transform") {
    return resolveLazyIfPresent(def.schema ?? def.innerType ?? def.out ?? def.in)
  }

  return undefined
}

function unwrapRecursive(
  schema: z.ZodTypeAny,
  depth: number,
  visited: WeakSet<object>,
): z.ZodTypeAny {
  if (depth >= MAX_UNWRAP_DEPTH) return schema

  const current = resolveLazy(schema)
  if (visited.has(current as object)) return current
  visited.add(current as object)

  const tag = typeTag(current)

  if (tag === "union") {
    const unwrapped = unwrapUnion(current)
    if (unwrapped === current) return current
    return unwrapRecursive(unwrapped, depth + 1, visited)
  }

  if (!WRAPPER_TAGS.has(tag)) return current

  const next = unwrapWrapper(current)
  if (!next || (tag === "transform" && typeTag(next) === "transform")) {
    return current
  }

  return unwrapRecursive(next, depth + 1, visited)
}

/**
 * Strip Zod wrapper types (optional, nullable, default, effects, pipe,
 * transform) and flatten unions whose only non-literal option is the main
 * type, to reach the inner value schema.
 *
 * @example
 * ```ts
 * unwrap(z.string().optional())                  // → ZodString
 * unwrap(z.number().nullable().default(0))       // → ZodNumber
 * unwrap(z.string().url().or(z.literal("")))     // → ZodString
 * ```
 */
export function unwrap(field: z.ZodTypeAny): z.ZodTypeAny {
  return unwrapRecursive(field, 0, new WeakSet())
}

// =============================================================================
// Optional-chain detection
// =============================================================================

function isLiteralUnionOption(schema: z.ZodTypeAny): boolean {
  return typeTag(resolveLazy(schema)) === "literal"
}

function isOptionalUnion(schema: z.ZodTypeAny): boolean {
  return unionOptions(schema).some(
    (option) => isLiteralUnionOption(option) || isOptionalChain(option),
  )
}

/**
 * Check whether a field is in an optional/nullable chain.
 *
 * A union containing a literal (e.g. `z.string().or(z.literal(""))`) or an
 * optional/nullable option is also considered optional, matching the UI's
 * historical behavior.
 *
 * @example
 * ```ts
 * isOptionalChain(z.string())                     // → false
 * isOptionalChain(z.string().optional())          // → true
 * isOptionalChain(z.string().nullable())          // → true
 * isOptionalChain(z.string().url().or(z.literal(""))) // → true
 * ```
 */
export function isOptionalChain(field: z.ZodTypeAny): boolean {
  let current = resolveLazy(field)

  for (let i = 0; i < 20; i++) {
    const tag = typeTag(current)
    const def = (current as unknown as { _def: ZodDef })._def

    if (tag === "optional" || tag === "nullable") return true
    if (tag === "union") return isOptionalUnion(current)
    if (tag === "default" || tag === "effects" || tag === "pipe" || tag === "pipeline") {
      const next = resolveLazyIfPresent(def.innerType ?? def.schema ?? def.in)
      if (!next) break
      current = next
      continue
    }
    if (tag === "lazy") {
      current = resolveLazy(current)
      continue
    }
    break
  }

  return false
}

// =============================================================================
// Value extraction
// =============================================================================

/**
 * Extract the default value from a `.default()` wrapper.
 *
 * @example
 * ```ts
 * const field = z.boolean().default(true)
 * getDefaultValue(field) // → true
 * ```
 */
export function getDefaultValue(field: z.ZodTypeAny): unknown {
  if (typeTag(field) !== "default") return undefined

  const def = (field as unknown as { _def: ZodDef })._def
  const dv = def.defaultValue
  return typeof dv === "function" ? dv() : dv
}

/**
 * Extract enum values (works with TS enums and const arrays).
 *
 * @example
 * ```ts
 * const Status = z.enum(["active", "inactive"])
 * getEnumValues(Status) // → ["active", "inactive"]
 * ```
 */
export function getEnumValues(current: z.ZodTypeAny): string[] {
  const def = (current as unknown as { _def: ZodDef })._def
  const entries = def.entries ?? def.values ?? {}
  return Object.values(entries) as string[]
}

/**
 * Check whether a schema is a Zod nativeEnum.
 *
 * In this workspace `z.nativeEnum` and `z.enum` share the same internal `type`
 * tag, so we distinguish nativeEnum by inspecting the entries: a nativeEnum
 * has keys that differ from their values or contains non-string values.
 */
export function isNativeEnum(schema: z.ZodTypeAny): boolean {
  if (typeTag(schema) !== "enum") return false

  const def = (schema as unknown as { _def: ZodDef })._def
  const entries = def.entries ?? {}
  return Object.entries(entries).some(
    ([key, value]) => key !== String(value) || typeof value !== "string",
  )
}

/**
 * Extract string values from a nativeEnum schema.
 *
 * Numeric TypeScript enums contain reverse mappings, so only string values are
 * returned to keep the result compatible with DML enum definitions.
 */
export function getNativeEnumValues(schema: z.ZodTypeAny): string[] {
  if (!isNativeEnum(schema)) return []

  const def = (schema as unknown as { _def: ZodDef })._def
  const entries = def.entries ?? {}
  return Object.values(entries).filter((value): value is string => typeof value === "string")
}

/**
 * Check whether a schema is a union of literal values.
 */
export function isLiteralUnion(schema: z.ZodTypeAny): boolean {
  if (typeTag(schema) !== "union") return false

  const options = unionOptions(schema)
  return options.length > 0 && options.every((option) => typeTag(resolveLazy(option)) === "literal")
}

function literalValue(schema: z.ZodTypeAny): unknown {
  const def = (schema as unknown as { _def?: { values?: unknown[] } })._def
  if (!Array.isArray(def?.values)) return undefined
  return def.values[0]
}

/**
 * Extract string literal values from a union-of-literals schema.
 */
export function getLiteralUnionValues(schema: z.ZodTypeAny): string[] {
  if (!isLiteralUnion(schema)) return []

  return unionOptions(schema)
    .map(literalValue)
    .filter((value): value is string => typeof value === "string")
}

/**
 * Extract the shape of a ZodObject (handles class & instance accessors).
 *
 * @example
 * ```ts
 * const schema = z.object({ id: z.string(), name: z.string() })
 * Object.keys(getObjectShape(schema)) // → ["id", "name"]
 * ```
 */
export function getObjectShape(current: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const schema = current as unknown as { shape?: unknown }
  const raw =
    typeof schema.shape === "function"
      ? (schema.shape as () => Record<string, z.ZodTypeAny>)()
      : ((schema.shape ?? {}) as Record<string, z.ZodTypeAny>)
  return typeof raw === "object" && raw !== null ? raw : {}
}

/** Whether a Zod object schema has an `id` field (entity-like). */
export function looksLikeEntity(field: z.ZodTypeAny): boolean {
  if (typeTag(field) !== "object") return false
  return Object.keys(getObjectShape(field)).includes("id")
}

// =============================================================================
// String utilities
// =============================================================================

/** Convert PascalCase or camelCase to snake_case. */
export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
}

/**
 * Fields that Medusa auto-manages on every model.
 * These must not be declared explicitly in DML schema definitions.
 */
export const IMPLICIT_PROPERTIES = new Set(["created_at", "updated_at", "deleted_at"])

// =============================================================================
// UI-specific helpers
// =============================================================================

/**
 * Check if a string schema has email validation.
 */
export function isEmailString(schema: z.ZodTypeAny): boolean {
  if (typeTag(schema) !== "string") return false

  const def = (schema as unknown as { _def: ZodDef })._def
  const checks = def.checks as Array<{ format?: string }> | undefined
  return checks?.some((check) => check.format === "email") ?? false
}

/**
 * Extract the shape (fields) from a Zod schema.
 *
 * Supports schemas wrapped in ZodPipe / transform. Returns `{}` for
 * non-object schemas.
 */
export function getZodShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const current = unwrap(schema)
  if (typeTag(current) !== "object") return {}
  return getObjectShape(current)
}

function baseTypeOf(schema: z.ZodTypeAny): SchemaFieldBaseType {
  switch (typeTag(schema)) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "enum":
      return "enum"
    case "date":
      return "date"
    case "array":
      return "array"
    case "object":
      return "object"
    default:
      return "unknown"
  }
}

const UNKNOWN_FIELD_INFO: SchemaFieldInfo = {
  baseType: "unknown",
  isOptional: true,
  isEmail: false,
  unwrapped: z.any(),
}

/**
 * Get information about a specific Zod field.
 *
 * Treats `null`/`undefined` as an unknown optional field so callers can
 * gracefully handle corrupted shapes without crashing.
 */
export function getZodFieldInfo(field: z.ZodTypeAny | null | undefined): SchemaFieldInfo {
  if (field == null) return UNKNOWN_FIELD_INFO

  const fieldDef = (field as unknown as { _def?: ZodDef })._def
  if (!fieldDef) {
    throw new Error("Invalid Zod schema: missing _def")
  }

  const unwrapped = unwrap(field)
  const baseType = baseTypeOf(unwrapped)
  const def = (unwrapped as unknown as { _def: ZodDef })._def

  return {
    baseType,
    isOptional: isOptionalChain(field),
    isEmail: baseType === "string" && isEmailString(unwrapped),
    enumValues: baseType === "enum" ? getEnumValues(unwrapped) : undefined,
    arrayElementInfo: baseType === "array" ? getZodFieldInfo(def.element) : undefined,
    unwrapped,
  }
}

function zodQueryResolveInternal(
  schema: z.ZodTypeAny,
  query: string,
  visited: WeakSet<object>,
): string {
  const current = unwrap(schema)
  if (typeTag(current) !== "object") return query
  if (visited.has(current as object)) return query
  visited.add(current as object)

  const shape = getObjectShape(current)

  return Object.keys(shape)
    .map((key) => {
      const field = shape[key]
      if (!field) return ""

      const info = getZodFieldInfo(field)
      const nestedQuery = query ? `${query}.${key}` : `${key}`
      const unwrappedDef = (info.unwrapped as unknown as { _def: ZodDef })._def

      if (info.baseType === "object") {
        return zodQueryResolveInternal(info.unwrapped, nestedQuery, visited)
      }

      if (info.baseType === "array") {
        return zodQueryResolveInternal(unwrappedDef.element, nestedQuery, visited)
      }

      return query ? `${query}.${key}` : key
    })
    .filter(Boolean)
    .join(",")
}

/**
 * Recursively build a Medusa remote-query field string from a Zod object
 * schema (e.g. `id,name,+address.city`).
 */
export function zodQueryResolve(schema: z.ZodTypeAny, query = ""): string {
  return zodQueryResolveInternal(schema, query, new WeakSet())
}
