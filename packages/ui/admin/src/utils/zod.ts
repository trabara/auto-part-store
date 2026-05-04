import { z } from "@medusajs/framework/zod";
import { zodResolver } from "@hookform/resolvers/zod";

import type { SchemaFieldInfo } from "../types";

// =============================================================================
// Zod Schema Analysis
// =============================================================================

/**
 * Check if a Zod schema is optional (accepts undefined, null, or empty string)
 */
function isOptional(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodOptional) return true;
  if (schema instanceof z.ZodNullable) return true;

  // Handle ZodUnion - e.g., z.string().url().optional().or(z.literal(''))
  // If one option is a literal (like empty string) or optional/nullable, the field is effectively optional
  if (schema instanceof z.ZodUnion) {
    const options = schema._def.options as z.ZodTypeAny[];
    for (const option of options) {
      // If any option is a literal (like ''), the field accepts empty values -> optional
      if (option instanceof z.ZodLiteral) return true;
      // If any option is optional/nullable, recursively check
      if (isOptional(option)) return true;
    }
  }

  return false;
}

/**
 * Unwrap a Zod schema to get the underlying type (removes Optional, Nullable, Default, Effects)
 */
function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;

  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodDefault ||
    current instanceof z.ZodPipe
  ) {
    if ("innerType" in current._def) {
      current = (current._def as any).innerType;
    } else if ("in" in current._def) {
      // ZodPipe replaces ZodEffects in v4 — unwrap to the input (source) schema
      current = (current._def as any).in;
    } else {
      break;
    }
  }

  // Handle ZodUnion - find the main type (not a literal)
  // This supports patterns like: z.string().url().optional().or(z.literal(''))
  if (current instanceof z.ZodUnion) {
    const options = current._def.options as z.ZodTypeAny[];
    for (const option of options) {
      const unwrapped = unwrapSchema(option);
      // Return the first non-literal type found
      if (!(unwrapped instanceof z.ZodLiteral)) {
        return unwrapped;
      }
    }
  }

  return current;
}

/**
 * Check if a ZodString has email validation
 */
function isEmailString(schema: z.ZodString): boolean {
  // In Zod v4, z.string().email() adds a check entry with format === 'email' in _def.checks
  const checks = (schema._def as any).checks as Array<any> | undefined;
  return checks?.some((c) => c.format === "email") ?? false;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Extract the shape (fields) from a Zod schema
 * Supports schemas wrapped in ZodPipe (transform) — in v4 refinements live inside schemas
 */
export function getZodShape<S extends z.ZodTypeAny, T = z.infer<S>>(
  schema: S,
): Record<string, z.ZodTypeAny> {
  try {
    // Unwrap ZodPipe (transforms) — in v4 refinements no longer wrap in a separate class
    let current: z.ZodTypeAny = schema;
    while (current instanceof z.ZodPipe) {
      current = (current._def as any).in;
    }

    // Now we should have a ZodObject
    if (!(current instanceof z.ZodObject)) {
      console.error(
        "[SnowForm] Schema must be a ZodObject (after unwrapping effects)",
      );
      return {} as Record<string, z.ZodTypeAny>;
    }

    // Try shape() function first (for lazy schemas)
    if (typeof (current._def as any).shape === "function") {
      return (current._def as any).shape();
    }
    // Fallback to shape property
    return (
      (current.shape as Record<string, z.ZodTypeAny>) ??
      ({} as Record<string, z.ZodTypeAny>)
    );
  } catch (error) {
    console.error("[SnowForm] Error getting schema shape:", error);
    return {} as Record<string, z.ZodTypeAny>;
  }
}

/**
 * Get information about a specific Zod field
 */
export function getZodFieldInfo(field: z.ZodTypeAny): SchemaFieldInfo {
  const unwrapped = unwrapSchema(field);

  // Detect base type
  let baseType: SchemaFieldInfo["baseType"] = "unknown";
  let enumValues: string[] | undefined;
  let isEmail = false;
  let arrayElementInfo: SchemaFieldInfo | undefined;

  if (unwrapped instanceof z.ZodString) {
    baseType = "string";
    isEmail = isEmailString(unwrapped);
  } else if (unwrapped instanceof z.ZodNumber) {
    baseType = "number";
  } else if (unwrapped instanceof z.ZodBoolean) {
    baseType = "boolean";
  } else if (unwrapped instanceof z.ZodEnum) {
    baseType = "enum";
    // In Zod v4, enum values are stored as _def.entries (EnumLike object), not _def.values (array)
    enumValues = Object.values((unwrapped._def as any).entries) as string[];
  } else if (unwrapped instanceof z.ZodDate) {
    baseType = "date";
  } else if (unwrapped instanceof z.ZodArray) {
    baseType = "array";
    // In Zod v4, array element type is _def.element (was _def.type in v3)
    arrayElementInfo = getZodFieldInfo((unwrapped._def as any).element);
  } else if (unwrapped instanceof z.ZodObject) {
    baseType = "object";
  }

  return {
    baseType,
    isOptional: isOptional(field),
    isEmail,
    enumValues,
    arrayElementInfo,
    unwrapped,
  };
}

/**
 * Create a resolver for react-hook-form from a Zod schema
 * Supports schemas with refine/superRefine (ZodPipe in v4)
 */
export function createZodResolver(schema: z.ZodTypeAny) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema as any);
}

export function zodQueryResolve(
  schema: z.ZodTypeAny,
  query: string = "",
): string {
  if (!(schema instanceof z.ZodObject)) {
    return query;
  }

  const shape = getZodShape(schema);

  return Object.keys(shape)
    .map((key) => {
      const field = shape[key]!;

      const info = getZodFieldInfo(field);
      if (info.baseType === "object") {
        return zodQueryResolve(
          info.unwrapped,
          query ? `${query}.${key}` : "+" + key,
        );
      } else if (info.baseType === "array") {
        return zodQueryResolve(
          // In Zod v4, array element type is _def.element (was _def.type in v3)
          (info.unwrapped._def as any).element,
          query ? `${query}.${key}` : "+" + key,
        );
      }
      return query ? `${query}.${key}` : key;
    })
    .join(",");
}
