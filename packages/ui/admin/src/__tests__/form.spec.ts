import { z } from "@medusajs/framework/zod";
import { getZodShape } from "../utils/zod";
import {
  initializeDefaultValues,
  applyEmptyValueOverrides,
  resolveFieldType,
} from "../utils/form";
import type { SchemaFieldInfo } from "../types";

// ---------------------------------------------------------------------------
// initializeDefaultValues
// ---------------------------------------------------------------------------
describe("initializeDefaultValues", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().optional(),
    active: z.boolean(),
    birthday: z.date().nullable(),
    role: z.enum(["admin", "user"]).optional(),
    tags: z.array(z.string()),
  });
  const shape = getZodShape(schema);

  it("sets empty string for string fields by default", () => {
    const result = initializeDefaultValues(shape);
    expect(result.name).toBe("");
  });

  it("sets null for number fields by default", () => {
    const result = initializeDefaultValues(shape);
    expect(result.age).toBeNull();
  });

  it("sets false for boolean fields", () => {
    const result = initializeDefaultValues(shape);
    expect(result.active).toBe(false);
  });

  it("sets null for date fields", () => {
    const result = initializeDefaultValues(shape);
    expect(result.birthday).toBeNull();
  });

  it("sets undefined for enum fields", () => {
    const result = initializeDefaultValues(shape);
    expect(result.role).toBeUndefined();
  });

  it("sets empty array for array fields", () => {
    const result = initializeDefaultValues(shape);
    expect(result.tags).toEqual([]);
  });

  it("uses provided values when available", () => {
    const result = initializeDefaultValues(shape, { name: "Alice", age: 30 });
    expect(result.name).toBe("Alice");
    expect(result.age).toBe(30);
  });

  it("applies emptyAsNull override for string fields", () => {
    const result = initializeDefaultValues(
      shape,
      {},
      { name: { emptyAsNull: true } },
    );
    expect(result.name).toBeNull();
  });

  it("applies emptyAsUndefined override for string fields", () => {
    const result = initializeDefaultValues(
      shape,
      {},
      { name: { emptyAsUndefined: true } },
    );
    expect(result.name).toBeUndefined();
  });

  it("applies emptyAsZero override for number fields", () => {
    const result = initializeDefaultValues(
      shape,
      {},
      { age: { emptyAsZero: true } },
    );
    expect(result.age).toBe(0);
  });

  it("returns empty object on error (bad schema shape)", () => {
    // Pass a corrupted shape that will throw during getZodFieldInfo
    const badShape = { x: null as any };
    const result = initializeDefaultValues(badShape);
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// applyEmptyValueOverrides
// ---------------------------------------------------------------------------
describe("applyEmptyValueOverrides", () => {
  it("converts empty string to null when emptyAsNull is set", () => {
    const result = applyEmptyValueOverrides(
      { name: "" },
      { name: { emptyAsNull: true } },
    );
    expect(result.name).toBeNull();
  });

  it("converts whitespace-only string to null when emptyAsNull is set", () => {
    const result = applyEmptyValueOverrides(
      { name: "   " },
      { name: { emptyAsNull: true } },
    );
    expect(result.name).toBeNull();
  });

  it("converts empty string to undefined when emptyAsUndefined is set", () => {
    const result = applyEmptyValueOverrides(
      { name: "" },
      { name: { emptyAsUndefined: true } },
    );
    expect(result.name).toBeUndefined();
  });

  it("converts null to 0 when emptyAsZero is set", () => {
    const result = applyEmptyValueOverrides(
      { count: null },
      { count: { emptyAsZero: true } },
    );
    expect(result.count).toBe(0);
  });

  it("converts undefined to 0 when emptyAsZero is set", () => {
    const result = applyEmptyValueOverrides(
      { count: undefined },
      { count: { emptyAsZero: true } },
    );
    expect(result.count).toBe(0);
  });

  it("does not modify fields without overrides", () => {
    const result = applyEmptyValueOverrides(
      { name: "", other: "keep" },
      { name: { emptyAsNull: true } },
    );
    expect(result.other).toBe("keep");
  });

  it("does not modify non-empty strings even when emptyAsNull is set", () => {
    const result = applyEmptyValueOverrides(
      { name: "Alice" },
      { name: { emptyAsNull: true } },
    );
    expect(result.name).toBe("Alice");
  });
});

// ---------------------------------------------------------------------------
// resolveFieldType
// ---------------------------------------------------------------------------
describe("resolveFieldType", () => {
  const makeInfo = (partial: Partial<SchemaFieldInfo>): SchemaFieldInfo => ({
    baseType: "unknown",
    isOptional: false,
    isEmail: false,
    unwrapped: z.string(),
    ...partial,
  });

  it("returns the override type when provided", () => {
    const info = makeInfo({ baseType: "string" });
    expect(resolveFieldType(info, { type: "textarea" })).toBe("textarea");
  });

  it("returns 'text' for string fields", () => {
    expect(
      resolveFieldType(makeInfo({ baseType: "string", isEmail: false })),
    ).toBe("text");
  });

  it("returns 'email' for string fields with isEmail=true", () => {
    expect(
      resolveFieldType(makeInfo({ baseType: "string", isEmail: true })),
    ).toBe("email");
  });

  it("returns 'number' for number fields", () => {
    expect(resolveFieldType(makeInfo({ baseType: "number" }))).toBe("number");
  });

  it("returns 'checkbox' for boolean fields", () => {
    expect(resolveFieldType(makeInfo({ baseType: "boolean" }))).toBe(
      "checkbox",
    );
  });

  it("returns 'date' for date fields", () => {
    expect(resolveFieldType(makeInfo({ baseType: "date" }))).toBe("date");
  });

  it("returns 'select' for enum fields", () => {
    expect(resolveFieldType(makeInfo({ baseType: "enum" }))).toBe("select");
  });

  it("returns 'text' for unknown fields", () => {
    expect(resolveFieldType(makeInfo({ baseType: "unknown" }))).toBe("text");
  });
});
