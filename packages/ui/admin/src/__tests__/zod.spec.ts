import { z } from "@medusajs/framework/zod";
import { getZodShape, getZodFieldInfo, zodQueryResolve } from "../utils/zod";

// ---------------------------------------------------------------------------
// getZodShape
// ---------------------------------------------------------------------------
describe("getZodShape", () => {
  it("returns the shape of a plain ZodObject", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const shape = getZodShape(schema);
    expect(Object.keys(shape)).toEqual(expect.arrayContaining(["name", "age"]));
  });

  it("unwraps a ZodPipe (transform) and returns the shape", () => {
    const schema = z
      .object({ title: z.string() })
      .transform((v) => ({ ...v, extra: true }));
    const shape = getZodShape(schema);
    expect(Object.keys(shape)).toContain("title");
  });

  it("returns an empty object for non-object schemas", () => {
    const shape = getZodShape(z.string());
    expect(shape).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getZodFieldInfo
// ---------------------------------------------------------------------------
describe("getZodFieldInfo", () => {
  it("detects string fields", () => {
    const info = getZodFieldInfo(z.string());
    expect(info.baseType).toBe("string");
    expect(info.isEmail).toBe(false);
    expect(info.isOptional).toBe(false);
  });

  it("detects email fields", () => {
    const info = getZodFieldInfo(z.string().email());
    expect(info.baseType).toBe("string");
    expect(info.isEmail).toBe(true);
  });

  it("detects number fields", () => {
    const info = getZodFieldInfo(z.number());
    expect(info.baseType).toBe("number");
  });

  it("detects boolean fields", () => {
    const info = getZodFieldInfo(z.boolean());
    expect(info.baseType).toBe("boolean");
  });

  it("detects date fields", () => {
    const info = getZodFieldInfo(z.date());
    expect(info.baseType).toBe("date");
  });

  it("detects enum fields and extracts values", () => {
    const info = getZodFieldInfo(z.enum(["a", "b", "c"]));
    expect(info.baseType).toBe("enum");
    expect(info.enumValues).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });

  it("detects array fields and provides element info", () => {
    const info = getZodFieldInfo(z.array(z.string()));
    expect(info.baseType).toBe("array");
    expect(info.arrayElementInfo?.baseType).toBe("string");
  });

  it("detects object fields", () => {
    const info = getZodFieldInfo(z.object({ x: z.number() }));
    expect(info.baseType).toBe("object");
  });

  it("marks optional fields", () => {
    const info = getZodFieldInfo(z.string().optional());
    expect(info.isOptional).toBe(true);
    expect(info.baseType).toBe("string");
  });

  it("marks nullable fields as optional", () => {
    const info = getZodFieldInfo(z.string().nullable());
    expect(info.isOptional).toBe(true);
    expect(info.baseType).toBe("string");
  });

  it("unwraps ZodDefault wrappers", () => {
    const info = getZodFieldInfo(z.string().default("hello"));
    expect(info.baseType).toBe("string");
  });

  it("handles union with literal as optional", () => {
    const info = getZodFieldInfo(z.string().url().or(z.literal("")));
    expect(info.isOptional).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// zodQueryResolve
// ---------------------------------------------------------------------------
describe("zodQueryResolve", () => {
  it("returns top-level field keys joined by commas", () => {
    const schema = z.object({ id: z.string(), name: z.string() });
    const result = zodQueryResolve(schema);
    expect(result.split(",")).toEqual(expect.arrayContaining(["id", "name"]));
  });

  it("returns the query unchanged for non-object schemas", () => {
    expect(zodQueryResolve(z.string(), "foo")).toBe("foo");
  });

  it("returns empty string for non-object schema with no query", () => {
    expect(zodQueryResolve(z.string())).toBe("");
  });

  it("prefixes nested object fields with +key notation", () => {
    const schema = z.object({
      address: z.object({ city: z.string(), zip: z.string() }),
    });
    const result = zodQueryResolve(schema);
    expect(result).toContain("+address");
  });
});
