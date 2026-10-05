import { z } from "@medusajs/framework/zod"
import {
  typeTag,
  resolveLazy,
  unwrap,
  isOptionalChain,
  getDefaultValue,
  getEnumValues,
  getNativeEnumValues,
  isLiteralUnion,
  getLiteralUnionValues,
  getObjectShape,
  looksLikeEntity,
  IMPLICIT_PROPERTIES,
  isEmailString,
  getZodShape,
  getZodFieldInfo,
  zodQueryResolve,
} from "./zod-introspect"

// ---------------------------------------------------------------------------
// typeTag
// ---------------------------------------------------------------------------
describe("typeTag", () => {
  it("returns the primitive type tag", () => {
    expect(typeTag(z.string())).toBe("string")
    expect(typeTag(z.number())).toBe("number")
    expect(typeTag(z.boolean())).toBe("boolean")
  })

  it("returns wrapper type tags", () => {
    expect(typeTag(z.string().optional())).toBe("optional")
    expect(typeTag(z.lazy(() => z.string()))).toBe("lazy")
  })

  it("returns an empty string for undefined or malformed schemas", () => {
    expect(typeTag(undefined)).toBe("")
    expect(typeTag({} as unknown as z.ZodTypeAny)).toBe("")
  })
})

// ---------------------------------------------------------------------------
// resolveLazy
// ---------------------------------------------------------------------------
describe("resolveLazy", () => {
  it("resolves a single lazy wrapper", () => {
    expect(typeTag(resolveLazy(z.lazy(() => z.string())))).toBe("string")
  })

  it("resolves nested lazy wrappers", () => {
    expect(typeTag(resolveLazy(z.lazy(() => z.lazy(() => z.number()))))).toBe("number")
  })

  it("returns non-lazy schemas unchanged", () => {
    expect(typeTag(resolveLazy(z.string()))).toBe("string")
  })

  it("does not infinite loop on self-referential lazy schemas", () => {
    const selfReferential: z.ZodTypeAny = z.lazy(() => selfReferential)
    expect(() => resolveLazy(selfReferential)).not.toThrow()
    expect(typeTag(resolveLazy(selfReferential))).toBe("lazy")
  })

  it("does not infinite loop on mutually circular lazy schemas", () => {
    const service: z.ZodTypeAny = z.object({
      device: z.lazy(() => device),
    })
    const device: z.ZodTypeAny = z.object({
      services: z.array(z.lazy(() => service)),
    })

    expect(() => resolveLazy(device)).not.toThrow()
    expect(() => resolveLazy(service)).not.toThrow()
    expect(typeTag(resolveLazy(device))).toBe("object")
    expect(typeTag(resolveLazy(service))).toBe("object")
  })
})

// ---------------------------------------------------------------------------
// unwrap
// ---------------------------------------------------------------------------
describe("unwrap", () => {
  it("unwraps optional wrappers", () => {
    expect(typeTag(unwrap(z.string().optional()))).toBe("string")
  })

  it("unwraps nullable wrappers", () => {
    expect(typeTag(unwrap(z.number().nullable()))).toBe("number")
  })

  it("unwraps default wrappers", () => {
    expect(typeTag(unwrap(z.string().default("hello")))).toBe("string")
  })

  it("unwraps effects wrappers", () => {
    const schema = z.preprocess((v) => v, z.boolean())
    expect(typeTag(unwrap(schema))).toBe("boolean")
  })

  it("unwraps pipe wrappers", () => {
    const schema = z.string().transform((v) => v.toUpperCase())
    expect(typeTag(unwrap(schema))).toBe("string")
  })

  it("unwraps nested wrappers", () => {
    expect(typeTag(unwrap(z.string().optional().nullable().default("x")))).toBe("string")
  })

  it("unwraps lazy wrappers", () => {
    expect(typeTag(unwrap(z.lazy(() => z.string().optional())))).toBe("string")
  })

  it("selects the first non-literal option in a union", () => {
    const schema = z.string().url().or(z.literal(""))
    expect(typeTag(unwrap(schema))).toBe("string")
  })

  it("returns the union itself when all options are literals", () => {
    const schema = z.literal("a").or(z.literal("b"))
    expect(typeTag(unwrap(schema))).toBe("union")
  })

  it("unwraps deeply nested wrappers", () => {
    let schema: z.ZodTypeAny = z.string()
    for (let i = 0; i < 15; i++) {
      schema = schema.optional()
    }
    expect(typeTag(unwrap(schema))).toBe("string")
  })

  it("unwraps a lazy wrapping deeply nested wrappers", () => {
    const schema = z.lazy(() => z.lazy(() => z.string().optional().nullable().default("x")))
    expect(typeTag(unwrap(schema))).toBe("string")
  })

  it("selects the first non-literal option in a union with multiple options", () => {
    const schema = z.number().or(z.string()).or(z.literal(""))
    expect(typeTag(unwrap(schema))).toBe("number")
  })

  it("unwraps unions containing lazy schemas", () => {
    const schema = z.lazy(() => z.string()).or(z.literal(""))
    expect(typeTag(unwrap(schema))).toBe("string")
  })
})

// ---------------------------------------------------------------------------
// isOptionalChain
// ---------------------------------------------------------------------------
describe("isOptionalChain", () => {
  it("returns false for required fields", () => {
    expect(isOptionalChain(z.string())).toBe(false)
  })

  it("returns true for optional fields", () => {
    expect(isOptionalChain(z.string().optional())).toBe(true)
  })

  it("returns true for nullable fields", () => {
    expect(isOptionalChain(z.string().nullable())).toBe(true)
  })

  it("returns true for default wrapping optional", () => {
    expect(isOptionalChain(z.string().optional().default("x"))).toBe(true)
  })

  it("returns false for default without optional", () => {
    expect(isOptionalChain(z.string().default("x"))).toBe(false)
  })

  it("returns true for union with literal", () => {
    expect(isOptionalChain(z.string().url().or(z.literal("")))).toBe(true)
  })

  it("returns true for union with optional option", () => {
    expect(isOptionalChain(z.string().or(z.string().optional()))).toBe(true)
  })

  it("returns false for union of required types", () => {
    expect(isOptionalChain(z.string().or(z.number()))).toBe(false)
  })

  it("returns true for lazy wrapping optional", () => {
    expect(isOptionalChain(z.lazy(() => z.string().optional()))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getDefaultValue
// ---------------------------------------------------------------------------
describe("getDefaultValue", () => {
  it("returns the default value for default schemas", () => {
    expect(getDefaultValue(z.string().default("hello"))).toBe("hello")
    expect(getDefaultValue(z.boolean().default(true))).toBe(true)
  })

  it("returns undefined for non-default schemas", () => {
    expect(getDefaultValue(z.string())).toBeUndefined()
  })

  it("returns the result of a default factory function", () => {
    expect(getDefaultValue(z.string().default(() => "dynamic"))).toBe("dynamic")
  })

  it("drops non-deterministic factory defaults", () => {
    let n = 0
    expect(getDefaultValue(z.number().default(() => n++))).toBeUndefined()
  })

  it("drops Date defaults, static or factory", () => {
    expect(getDefaultValue(z.date().default(() => new Date()))).toBeUndefined()
    expect(getDefaultValue(z.date().default(new Date(0)))).toBeUndefined()
  })

  it("finds defaults under optional/nullable wrappers", () => {
    expect(getDefaultValue(z.string().default("x").nullable())).toBe("x")
  })

  it("keeps static object defaults", () => {
    expect(getDefaultValue(z.array(z.string()).default(["a"]))).toEqual(["a"])
  })
})

// ---------------------------------------------------------------------------
// getEnumValues
// ---------------------------------------------------------------------------
describe("getEnumValues", () => {
  it("extracts enum values from a string enum", () => {
    expect(getEnumValues(z.enum(["a", "b", "c"]))).toEqual(expect.arrayContaining(["a", "b", "c"]))
  })

  it("returns an empty array for non-enum schemas", () => {
    expect(getEnumValues(z.string())).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getNativeEnumValues
// ---------------------------------------------------------------------------
enum StringEnum {
  A = "a",
  B = "b",
}

enum NumericEnum {
  One = 1,
  Two = 2,
}

describe("getNativeEnumValues", () => {
  it("extracts string values from a nativeEnum", () => {
    expect(getNativeEnumValues(z.nativeEnum(StringEnum))).toEqual(["a", "b"])
  })

  it("keeps string reverse mappings for numeric enums", () => {
    expect(getNativeEnumValues(z.nativeEnum(NumericEnum))).toEqual(["One", "Two"])
  })

  it("returns an empty array for non-nativeEnum schemas", () => {
    expect(getNativeEnumValues(z.enum(["a", "b"]))).toEqual([])
    expect(getNativeEnumValues(z.string())).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// isLiteralUnion / getLiteralUnionValues
// ---------------------------------------------------------------------------
describe("isLiteralUnion", () => {
  it("returns true for a union of string literals", () => {
    expect(isLiteralUnion(z.union([z.literal("a"), z.literal("b")]))).toBe(true)
  })

  it("returns true for a union of mixed-type literals", () => {
    expect(isLiteralUnion(z.union([z.literal("a"), z.literal(1)]))).toBe(true)
  })

  it("returns false for a union containing non-literals", () => {
    expect(isLiteralUnion(z.union([z.string(), z.literal("a")]))).toBe(false)
  })

  it("returns false for non-union schemas", () => {
    expect(isLiteralUnion(z.string())).toBe(false)
    expect(isLiteralUnion(z.literal("a"))).toBe(false)
  })
})

describe("getLiteralUnionValues", () => {
  it("extracts string values from a union of string literals", () => {
    expect(getLiteralUnionValues(z.union([z.literal("a"), z.literal("b")]))).toEqual(["a", "b"])
  })

  it("filters to string values only", () => {
    expect(getLiteralUnionValues(z.union([z.literal("a"), z.literal(1)]))).toEqual(["a"])
  })

  it("returns an empty array for non-literal unions", () => {
    expect(getLiteralUnionValues(z.string())).toEqual([])
    expect(getLiteralUnionValues(z.union([z.string(), z.number()]))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getObjectShape / looksLikeEntity
// ---------------------------------------------------------------------------
describe("getObjectShape", () => {
  it("returns the shape of a ZodObject", () => {
    const schema = z.object({ id: z.string(), name: z.string() })
    expect(Object.keys(getObjectShape(schema))).toEqual(expect.arrayContaining(["id", "name"]))
  })

  it("returns an empty object for non-object schemas", () => {
    expect(getObjectShape(z.string())).toEqual({})
  })
})

describe("looksLikeEntity", () => {
  it("returns true for objects with an id field", () => {
    expect(looksLikeEntity(z.object({ id: z.string() }))).toBe(true)
  })

  it("returns false for objects without an id field", () => {
    expect(looksLikeEntity(z.object({ name: z.string() }))).toBe(false)
  })

  it("returns false for non-object schemas", () => {
    expect(looksLikeEntity(z.string())).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// IMPLICIT_PROPERTIES
// ---------------------------------------------------------------------------
describe("IMPLICIT_PROPERTIES", () => {
  it("contains the expected implicit property names", () => {
    expect(IMPLICIT_PROPERTIES.has("created_at")).toBe(true)
    expect(IMPLICIT_PROPERTIES.has("updated_at")).toBe(true)
    expect(IMPLICIT_PROPERTIES.has("deleted_at")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isEmailString
// ---------------------------------------------------------------------------
describe("isEmailString", () => {
  it("detects email-validated strings", () => {
    expect(isEmailString(z.string().email())).toBe(true)
  })

  it("returns false for plain strings", () => {
    expect(isEmailString(z.string())).toBe(false)
  })

  it("returns false for non-string schemas", () => {
    expect(isEmailString(z.number())).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getZodShape
// ---------------------------------------------------------------------------
describe("getZodShape", () => {
  it("returns the shape of a plain ZodObject", () => {
    const schema = z.object({ name: z.string(), age: z.number() })
    const shape = getZodShape(schema)
    expect(Object.keys(shape)).toEqual(expect.arrayContaining(["name", "age"]))
  })

  it("unwraps a ZodPipe transform and returns the shape", () => {
    const schema = z.object({ title: z.string() }).transform((v) => ({ ...v, extra: true }))
    const shape = getZodShape(schema)
    expect(Object.keys(shape)).toContain("title")
  })

  it("returns an empty object for non-object schemas", () => {
    expect(getZodShape(z.string())).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// getZodFieldInfo
// ---------------------------------------------------------------------------
describe("getZodFieldInfo", () => {
  it("detects string fields", () => {
    const info = getZodFieldInfo(z.string())
    expect(info.baseType).toBe("string")
    expect(info.isEmail).toBe(false)
    expect(info.isOptional).toBe(false)
  })

  it("detects email fields", () => {
    const info = getZodFieldInfo(z.string().email())
    expect(info.baseType).toBe("string")
    expect(info.isEmail).toBe(true)
  })

  it("detects number fields", () => {
    const info = getZodFieldInfo(z.number())
    expect(info.baseType).toBe("number")
  })

  it("detects boolean fields", () => {
    const info = getZodFieldInfo(z.boolean())
    expect(info.baseType).toBe("boolean")
  })

  it("detects date fields", () => {
    const info = getZodFieldInfo(z.date())
    expect(info.baseType).toBe("date")
  })

  it("detects enum fields and extracts values", () => {
    const info = getZodFieldInfo(z.enum(["a", "b", "c"]))
    expect(info.baseType).toBe("enum")
    expect(info.enumValues).toEqual(expect.arrayContaining(["a", "b", "c"]))
  })

  it("detects array fields and provides element info", () => {
    const info = getZodFieldInfo(z.array(z.string()))
    expect(info.baseType).toBe("array")
    expect(info.arrayElementInfo?.baseType).toBe("string")
  })

  it("detects object fields", () => {
    const info = getZodFieldInfo(z.object({ x: z.number() }))
    expect(info.baseType).toBe("object")
  })

  it("marks optional fields", () => {
    const info = getZodFieldInfo(z.string().optional())
    expect(info.isOptional).toBe(true)
    expect(info.baseType).toBe("string")
  })

  it("marks nullable fields as optional", () => {
    const info = getZodFieldInfo(z.string().nullable())
    expect(info.isOptional).toBe(true)
    expect(info.baseType).toBe("string")
  })

  it("unwraps default wrappers", () => {
    const info = getZodFieldInfo(z.string().default("hello"))
    expect(info.baseType).toBe("string")
  })

  it("handles union with literal as optional", () => {
    const info = getZodFieldInfo(z.string().url().or(z.literal("")))
    expect(info.isOptional).toBe(true)
    expect(info.baseType).toBe("string")
  })

  it("preserves default wrappers as not optional", () => {
    const info = getZodFieldInfo(z.string().default("hello"))
    expect(info.isOptional).toBe(false)
  })

  it("detects nested arrays", () => {
    const info = getZodFieldInfo(z.array(z.array(z.number())))
    expect(info.baseType).toBe("array")
    expect(info.arrayElementInfo?.baseType).toBe("array")
    expect(info.arrayElementInfo?.arrayElementInfo?.baseType).toBe("number")
  })

  it("detects unknown types", () => {
    const info = getZodFieldInfo(z.any())
    expect(info.baseType).toBe("unknown")
  })

  it("returns default info for null input", () => {
    const info = getZodFieldInfo(null)
    expect(info.baseType).toBe("unknown")
    expect(info.isOptional).toBe(true)
    expect(info.isEmail).toBe(false)
    expect(typeTag(info.unwrapped)).toBe("any")
  })

  it("returns default info for undefined input", () => {
    const info = getZodFieldInfo(undefined)
    expect(info.baseType).toBe("unknown")
    expect(info.isOptional).toBe(true)
    expect(info.isEmail).toBe(false)
    expect(typeTag(info.unwrapped)).toBe("any")
  })

  it("throws for non-Zod objects", () => {
    expect(() => getZodFieldInfo({} as unknown as z.ZodTypeAny)).toThrow(
      "Invalid Zod schema: missing _def",
    )
  })
})

// ---------------------------------------------------------------------------
// zodQueryResolve
// ---------------------------------------------------------------------------
describe("zodQueryResolve", () => {
  it("returns top-level field keys joined by commas", () => {
    const schema = z.object({ id: z.string(), name: z.string() })
    const result = zodQueryResolve(schema)
    expect(result.split(",")).toEqual(expect.arrayContaining(["id", "name"]))
  })

  it("returns the query unchanged for non-object schemas", () => {
    expect(zodQueryResolve(z.string(), "foo")).toBe("foo")
  })

  it("returns empty string for non-object schema with no query", () => {
    expect(zodQueryResolve(z.string())).toBe("")
  })

  it("resolves nested object fields as dotted paths", () => {
    const schema = z.object({
      address: z.object({ city: z.string(), zip: z.string() }),
    })
    expect(zodQueryResolve(schema)).toBe("address.city,address.zip")
  })

  it("keeps primitive array fields as a single path", () => {
    const schema = z.object({ items: z.array(z.string()) })
    expect(zodQueryResolve(schema)).toBe("items")
  })

  it("expands a schema reused by sibling fields for each sibling", () => {
    const Address = z.object({ id: z.string(), city: z.string() })
    const schema = z.object({ billing: Address, shipping: Address })
    expect(zodQueryResolve(schema)).toBe(
      "billing.id,billing.city,shipping.id,shipping.city",
    )
  })

  it("resolves nested object inside an array", () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.string(), name: z.string() })),
    })
    expect(zodQueryResolve(schema)).toBe("items.id,items.name")
  })

  it("does not infinite loop on circular object schemas", () => {
    const service: z.ZodTypeAny = z.object({
      device: z.lazy(() => device),
    })
    const device: z.ZodTypeAny = z.object({
      services: z.array(z.lazy(() => service)),
    })

    expect(() => zodQueryResolve(device)).not.toThrow()
  })

  it("resolves realistic mutually circular entity schemas", () => {
    const BaseSchema = z.object({ id: z.string() })

    const DeviceServiceSchema: z.ZodTypeAny = BaseSchema.extend({
      name: z.string(),
      repair_request_device: z.lazy(() => RepairRequestDeviceSchema).optional(),
    })
    const RepairRequestDeviceSchema: z.ZodTypeAny = BaseSchema.extend({
      device_id: z.string(),
      services: z.array(DeviceServiceSchema).min(1),
      repair_request: z.lazy(() => RepairRequestSchema).optional(),
    })
    const RepairRequestSchema: z.ZodTypeAny = BaseSchema.extend({
      status: z.string(),
      devices: z.array(RepairRequestDeviceSchema).min(1),
    })

    expect(() => zodQueryResolve(RepairRequestSchema)).not.toThrow()

    const result = zodQueryResolve(RepairRequestSchema).split(",")
    expect(result).toEqual(
      expect.arrayContaining([
        "id",
        "status",
        "devices.device_id",
        "devices.services.name",
      ]),
    )
    // cycles back to RepairRequest contribute nothing
    expect(result).not.toContain("devices.repair_request")
  })
})
