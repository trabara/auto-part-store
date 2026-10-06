import { z } from "@medusajs/framework/zod";
import { getZodShape, SchemaFieldInfo } from "@repo/framework/utils";
import {
  initializeDefaultValues,
  applyEmptyValueOverrides,
  resolveFieldType,
  emptyStringsToNull,
  createZodResolver,
  humanizeErrors,
} from "./form";

// ---------------------------------------------------------------------------
// initializeDefaultValues
// ---------------------------------------------------------------------------
describe("initializeDefaultValues", () => {
  it("uses static schema defaults, and provided values over them", () => {
    const withDefaults = {
      fuel: z.enum(["GASOLINE", "DIESEL"]).default("GASOLINE"),
      size: z.string().default("1.0"),
      doors: z.number().default(4),
    };
    expect(initializeDefaultValues(withDefaults)).toEqual({
      fuel: "GASOLINE",
      size: "1.0",
      doors: 4,
    });
    expect(initializeDefaultValues(withDefaults, { doors: 2 })).toMatchObject({ doors: 2 });
  });

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
    const badShape = { x: {} as any };
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

describe("emptyStringsToNull", () => {
  const shape = {
    position_id: z.string().nullish(),
    notes: z.string().nullable(),
    name: z.string(),
    count: z.number().nullable(),
  };

  it("sends null for blank strings in nullable fields only", () => {
    expect(
      emptyStringsToNull({ position_id: "", notes: "  ", name: "", count: null } as any, shape),
    ).toEqual({ position_id: null, notes: null, name: "", count: null });
  });

  it("keeps values and unknown fields", () => {
    expect(emptyStringsToNull({ position_id: "p1", extra: "" } as any, shape)).toEqual({
      position_id: "p1",
      extra: "",
    });
  });
});

describe("createZodResolver", () => {
  it("validates blank optional ids as null", async () => {
    const schema = z.object({ vehicle_id: z.string().min(1), position_id: z.string().min(1).nullish() });
    const resolve = createZodResolver(schema);
    const ok = await resolve({ vehicle_id: "v1", position_id: "" }, undefined, { fields: {}, shouldUseNativeValidation: false } as any);
    expect(ok.errors).toEqual({});
    expect(ok.values).toEqual({ vehicle_id: "v1", position_id: null });
    const bad = await resolve({ vehicle_id: "", position_id: "" }, undefined, { fields: {}, shouldUseNativeValidation: false } as any);
    expect(Object.keys(bad.errors)).toEqual(["vehicle_id"]);
  });
});

describe("humanizeErrors", () => {
  it("reads missing values as Required and keeps other messages", async () => {
    const resolve = createZodResolver(z.object({ year: z.number(), name: z.string().min(3) }));
    const { errors } = await resolve({ year: null, name: "ab" }, undefined, { fields: {}, shouldUseNativeValidation: false } as any);
    expect(errors.year?.message).toBe("Required");
    expect(errors.name?.message).not.toBe("Required");
    const select = await resolve({ year: 2020, name: "abc", ...{ kind: "" } }, undefined, { fields: {}, shouldUseNativeValidation: false } as any);
    expect(select.errors).toEqual({});
    const withEnum = createZodResolver(z.object({ kind: z.enum(["A", "B"]) }));
    const empty = await withEnum({ kind: "" }, undefined, { fields: {}, shouldUseNativeValidation: false } as any);
    expect(empty.errors.kind?.message).toBe("Required");
    const wrong = await withEnum({ kind: "C" }, undefined, { fields: {}, shouldUseNativeValidation: false } as any);
    expect(wrong.errors.kind?.message).not.toBe("Required");
    expect(humanizeErrors({ a: { message: "Invalid input: expected string, received undefined", type: "x" } })).toEqual({
      a: { message: "Required", type: "x" },
    });
  });
});
