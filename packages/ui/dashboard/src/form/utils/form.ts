import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "@medusajs/framework/zod";
import type { DefaultValues, FieldValues } from "react-hook-form";

import { getDefaultValue, getZodFieldInfo, getZodShape, SchemaFieldInfo } from "@repo/framework/utils";
import { FieldOverride, FieldType } from "../types";

/**
 * Initialize default values based on schema types and overrides
 *
 * @param schemaShape - The schema shape (field definitions)
 * @param providedValues - User-provided default values
 * @param overrides - Field configuration overrides
 * @returns Default values for the form
 */
export function initializeDefaultValues<T extends FieldValues>(
  schemaShape: Record<string, z.ZodTypeAny>,
  providedValues: Partial<T> = {},
  overrides: Partial<Record<string, FieldOverride>> = {},
): DefaultValues<T> {
  try {
    const defaultValues = Object.entries(schemaShape).reduce(
      (acc, [key, field]) => {
        const fieldInfo = getZodFieldInfo(field);
        const override = overrides[key];

        // Check if a provided value exists for this field
        if (providedValues[key as keyof T] !== undefined) {
          acc[key] = providedValues[key as keyof T];
          return acc;
        }

        // Static schema default (`.default(x)`)
        const schemaDefault = getDefaultValue(field);
        if (schemaDefault !== undefined) {
          acc[key] = schemaDefault;
          return acc;
        }

        // Initialize based on field type
        switch (fieldInfo.baseType) {
          case "string":
            if (override?.emptyAsNull) acc[key] = null;
            else if (override?.emptyAsUndefined) acc[key] = undefined;
            else acc[key] = "";
            break;
          case "number":
            if (override?.emptyAsZero) acc[key] = 0;
            else if (override?.emptyAsNull) acc[key] = null;
            else if (override?.emptyAsUndefined) acc[key] = undefined;
            else acc[key] = null;
            break;
          case "boolean":
            acc[key] = false;
            break;
          case "date":
            acc[key] = null;
            break;
          case "enum":
            acc[key] = undefined;
            break;
          case "array":
            acc[key] = [];
            break;
          default:
            acc[key] = undefined;
        }

        return acc;
      },
      {} as Record<string, unknown>,
    );

    return { ...defaultValues, ...providedValues } as DefaultValues<T>;
  } catch {
    return {} as DefaultValues<T>;
  }
}

/**
 * Apply empty value overrides before submission
 * Transforms empty strings to null/undefined/0 based on field config
 *
 * @param values - The form values to transform
 * @param overrides - Field configuration overrides
 * @returns Transformed values
 */
export function applyEmptyValueOverrides<T extends FieldValues>(
  values: T,
  overrides: Partial<Record<string, FieldOverride>>,
): T {
  const transformed = { ...values };

  for (const key of Object.keys(transformed)) {
    const override = overrides[key];
    if (!override) continue;

    const value = transformed[key];
    const isEmptyString =
      value === "" || (typeof value === "string" && value.trim() === "");

    if (override.emptyAsNull && isEmptyString) {
      transformed[key as keyof T] = null as T[keyof T];
    } else if (override.emptyAsUndefined && isEmptyString) {
      transformed[key as keyof T] = undefined as T[keyof T];
    } else if (
      override.emptyAsZero &&
      (value === null || value === undefined || isEmptyString)
    ) {
      transformed[key as keyof T] = 0 as T[keyof T];
    }
  }

  return transformed;
}

/**
 * Determine the field type based on schema info and override.
 * Override type takes priority, otherwise auto-detect from schema.
 */
export function resolveFieldType(
  fieldInfo: SchemaFieldInfo,
  override?: FieldOverride,
): FieldType {
  if (override?.type) {
    return override.type;
  }

  switch (fieldInfo.baseType) {
    case "string":
      return fieldInfo.isEmail ? "email" : "text";
    case "number":
      return "number";
    case "boolean":
      return "checkbox";
    case "date":
      return "date";
    case "enum":
      return "select";
    default:
      return "text";
  }
}

/**
 * Create a resolver for react-hook-form from a Zod schema.
 *
 * Supports schemas with refine/superRefine (ZodPipe in v4).
 */
export function createZodResolver(schema: z.ZodTypeAny) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolve = zodResolver(schema as any);
  const shape = getZodShape(schema);
  // Blank optional fields validate (and submit) as null, not "".
  return (async (values: FieldValues, context: unknown, options: any) => {
    const prepared = emptyStringsToNull(values, shape);
    const result = await resolve(prepared, context, options);
    return { ...result, errors: humanizeErrors(result.errors, prepared) };
  }) as typeof resolve;
}

/** Message of a missing required value (translated as `erp.ui.required` where shown). */
export const REQUIRED_MESSAGE = "Required";

// Zod's message for a missing value ("Invalid input: expected number, received null").
const MISSING_VALUE = /^Invalid input: expected \w+, received (null|undefined|NaN)$/;

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";

/**
 * Zod's technical messages for a missing value ("Invalid input: expected
 * number, received null", "Invalid option: expected one of …" on an empty
 * select) read as "Required".
 */
export function humanizeErrors<E extends Record<string, any>>(errors: E, values: Record<string, unknown> = {}): E {
  const out: Record<string, any> = {};
  for (const [key, error] of Object.entries(errors ?? {})) {
    const message = error && typeof error.message === "string" ? error.message : "";
    const missing = MISSING_VALUE.test(message) || (/^Invalid/.test(message) && key in values && isEmpty(values[key]));
    out[key] = missing ? { ...error, message: REQUIRED_MESSAGE } : error;
  }
  return out as E;
}

/**
 * Blank strings in fields that accept null become null: an unset optional
 * picker or an empty nullable text sends `null`, never `""` (an empty id
 * would otherwise reach the API as a value). Runs after the per-field
 * `emptyAs*` overrides, which win.
 */
export function emptyStringsToNull<T extends FieldValues>(
  values: T,
  shape: Record<string, z.ZodTypeAny>,
): T {
  const transformed = { ...values };
  for (const key of Object.keys(transformed)) {
    const value = transformed[key];
    const field = shape[key];
    if (typeof value !== "string" || value.trim() !== "" || !field) continue;
    if (field.safeParse(null).success) transformed[key as keyof T] = null as T[keyof T];
  }
  return transformed;
}
