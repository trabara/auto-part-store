import { z } from "@medusajs/framework/zod"
import { zodSchemaToDml } from "./schema-to-dml"
import { zodFieldToDml, buildDmlProperty } from "./field-to-dml"
import {
  StatusSchema,
  NativeStatus,
  NativeStatusSchema,
  CustomerSchema,
  OrderSchema,
} from "./_test-utils"

describe("zodFieldToDml", () => {
  it("maps string to text", () => {
    const result = zodFieldToDml(z.string().min(1), "name")
    expect(result.fieldDef?.dmlType).toBe("text")
    expect(result.fieldDef?.nullable).toBe(false)
  })

  it("maps optional string to text nullable", () => {
    const result = zodFieldToDml(z.string().optional(), "description")
    expect(result.fieldDef?.dmlType).toBe("text")
    expect(result.fieldDef?.nullable).toBe(true)
  })

  it("maps id field to id type", () => {
    const result = zodFieldToDml(z.string().min(1), "id")
    expect(result.fieldDef?.dmlType).toBe("id")
  })

  it("maps boolean with default", () => {
    const result = zodFieldToDml(z.boolean().default(false), "is_active")
    expect(result.fieldDef?.dmlType).toBe("boolean")
    expect(result.fieldDef?.default).toBe(false)
  })

  it("maps text with default", () => {
    const result = zodFieldToDml(z.string().default("draft"), "status")
    expect(result.fieldDef?.dmlType).toBe("text")
    expect(result.fieldDef?.default).toBe("draft")
  })

  it("maps number with default", () => {
    const result = zodFieldToDml(z.number().default(0), "count")
    expect(result.fieldDef?.dmlType).toBe("number")
    expect(result.fieldDef?.default).toBe(0)
  })

  it("drops Date defaults so no fixed timestamp is baked into the column", () => {
    const now = new Date("2026-08-03T00:00:00Z")
    const result = zodFieldToDml(z.date().default(now), "starts_at")
    expect(result.fieldDef?.dmlType).toBe("dateTime")
    expect(result.fieldDef?.default).toBeUndefined()
  })

  it("maps enum with default", () => {
    const result = zodFieldToDml(StatusSchema.default("pending"), "status")
    expect(result.fieldDef?.dmlType).toBe("enum")
    expect(result.fieldDef?.enumValues).toEqual(["active", "inactive", "pending"])
    expect(result.fieldDef?.default).toBe("pending")
  })

  it("maps string literal to text with default", () => {
    const result = zodFieldToDml(z.literal("active"), "state")
    expect(result.fieldDef?.dmlType).toBe("text")
    expect(result.fieldDef?.default).toBe("active")
  })

  it("maps number literal to number with default", () => {
    const result = zodFieldToDml(z.literal(42), "answer")
    expect(result.fieldDef?.dmlType).toBe("number")
    expect(result.fieldDef?.default).toBe(42)
  })

  it("maps boolean literal to boolean with default", () => {
    const result = zodFieldToDml(z.literal(true), "enabled")
    expect(result.fieldDef?.dmlType).toBe("boolean")
    expect(result.fieldDef?.default).toBe(true)
  })

  it("maps number to number", () => {
    const result = zodFieldToDml(z.number().int(), "count")
    expect(result.fieldDef?.dmlType).toBe("number")
  })

  it("maps nullable number to nullable number", () => {
    const result = zodFieldToDml(z.number().nullable(), "price")
    expect(result.fieldDef?.dmlType).toBe("number")
    expect(result.fieldDef?.nullable).toBe(true)
  })

  it("maps date to dateTime", () => {
    const result = zodFieldToDml(z.date(), "created_at")
    expect(result.fieldDef?.dmlType).toBe("dateTime")
  })

  it("maps enum to enum type", () => {
    const result = zodFieldToDml(StatusSchema, "status")
    expect(result.fieldDef?.dmlType).toBe("enum")
    expect(result.fieldDef?.enumValues).toEqual(["active", "inactive", "pending"])
  })

  it("maps nativeEnum to enum type with string values", () => {
    const result = zodFieldToDml(NativeStatusSchema, "status")
    expect(result.fieldDef?.dmlType).toBe("enum")
    expect(result.fieldDef?.enumValues).toEqual(["draft", "published", "archived"])
  })

  it("maps nativeEnum with default", () => {
    const result = zodFieldToDml(NativeStatusSchema.default(NativeStatus.Draft), "status")
    expect(result.fieldDef?.dmlType).toBe("enum")
    expect(result.fieldDef?.enumValues).toEqual(["draft", "published", "archived"])
    expect(result.fieldDef?.default).toBe(NativeStatus.Draft)
  })

  it("maps union of string literals to enum type", () => {
    const schema = z.union([z.literal("a"), z.literal("b"), z.literal("c")])
    const result = zodFieldToDml(schema, "letter")
    expect(result.fieldDef?.dmlType).toBe("enum")
    expect(result.fieldDef?.enumValues).toEqual(["a", "b", "c"])
  })

  it("maps union of string literals with default", () => {
    const schema = z.union([z.literal("a"), z.literal("b")]).default("a")
    const result = zodFieldToDml(schema, "letter")
    expect(result.fieldDef?.dmlType).toBe("enum")
    expect(result.fieldDef?.enumValues).toEqual(["a", "b"])
    expect(result.fieldDef?.default).toBe("a")
  })

  it("maps entity-like object to belongsTo", () => {
    const result = zodFieldToDml(CustomerSchema, "customer")
    expect(result.relation?.kind).toBe("belongsTo")
  })

  it("maps array of entity objects to hasMany", () => {
    const result = zodFieldToDml(z.array(CustomerSchema), "customers")
    expect(result.relation?.kind).toBe("hasMany")
  })

  it("maps array of plain objects to json", () => {
    const itemsSchema = z.array(z.object({ product_id: z.string() }))
    const result = zodFieldToDml(itemsSchema, "items")
    expect(result.fieldDef?.dmlType).toBe("json")
    expect(result.relation?.kind).toBe("json")
  })

  it("maps primitive array to json", () => {
    const result = zodFieldToDml(z.array(z.string()), "tags")
    expect(result.fieldDef?.dmlType).toBe("json")
  })

  it("resolves z.lazy array elements to hasMany", () => {
    const ChildSchema = z.object({ id: z.string() })
    const ParentSchema = z.object({
      id: z.string(),
      children: z.array(z.lazy(() => ChildSchema)),
    })
    const result = zodFieldToDml(ParentSchema.shape.children, "children")
    expect(result.relation?.kind).toBe("hasMany")
  })

  it("maps record to json", () => {
    const result = zodFieldToDml(z.record(z.string(), z.any()), "metadata")
    expect(result.fieldDef?.dmlType).toBe("json")
  })

  it("maps nullable optional chain to text nullable", () => {
    const result = zodFieldToDml(z.string().nullable().optional(), "nickname")
    expect(result.fieldDef?.dmlType).toBe("text")
    expect(result.fieldDef?.nullable).toBe(true)
  })

  it("maps nullish to text nullable", () => {
    const result = zodFieldToDml(z.string().nullish(), "alias")
    expect(result.fieldDef?.dmlType).toBe("text")
    expect(result.fieldDef?.nullable).toBe(true)
  })

  it("unwraps preprocess (pipe) and detects inner type", () => {
    const result = zodFieldToDml(z.preprocess((v) => Number(v), z.number()).optional(), "count")
    expect(result.fieldDef?.dmlType).toBe("number")
    expect(result.fieldDef?.nullable).toBe(true)
  })

  it("unwraps pipe transform to underlying input type", () => {
    const result = zodFieldToDml(
      z.string().transform((s) => s.toUpperCase()),
      "code",
    )
    expect(result.fieldDef?.dmlType).toBe("text")
  })

  it("maps nested object without id to json", () => {
    const result = zodFieldToDml(z.object({ key: z.string(), value: z.number() }), "metadata")
    expect(result.fieldDef?.dmlType).toBe("json")
  })

  it("falls back unrecognised types to json", () => {
    expect(zodFieldToDml(z.any(), "raw").fieldDef?.dmlType).toBe("json")
    expect(zodFieldToDml(z.unknown(), "data").fieldDef?.dmlType).toBe("json")
    expect(zodFieldToDml(z.null(), "nil").fieldDef?.dmlType).toBe("json")
    expect(zodFieldToDml(z.undefined(), "undef").fieldDef?.dmlType).toBe("json")
    expect(zodFieldToDml(z.bigint(), "big").fieldDef?.dmlType).toBe("json")
  })
})

describe("buildDmlProperty", () => {
  it("builds text with default", () => {
    const result = buildDmlProperty(z.string().default("draft"), "status")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("status")
    expect(result?.property).toBeDefined()
  })

  it("builds number with default", () => {
    const result = buildDmlProperty(z.number().default(0), "count")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("count")
    expect(result?.property).toBeDefined()
  })

  it("builds dateTime with default", () => {
    const now = new Date("2026-08-03T00:00:00Z")
    const result = buildDmlProperty(z.date().default(now), "starts_at")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("starts_at")
    expect(result?.property).toBeDefined()
  })

  it("builds boolean with default", () => {
    const result = buildDmlProperty(z.boolean().default(false), "is_active")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("is_active")
    expect(result?.property).toBeDefined()
  })

  it("builds enum with default", () => {
    const result = buildDmlProperty(StatusSchema.default("pending"), "status")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("status")
    expect(result?.property).toBeDefined()
  })

  it("builds nativeEnum as enum", () => {
    const result = buildDmlProperty(NativeStatusSchema, "status")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("status")
    expect(result?.property).toBeDefined()
  })

  it("builds nativeEnum with default", () => {
    const result = buildDmlProperty(NativeStatusSchema.default(NativeStatus.Draft), "status")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("status")
    expect(result?.property).toBeDefined()
  })

  it("builds union of string literals as enum", () => {
    const schema = z.union([z.literal("a"), z.literal("b")])
    const result = buildDmlProperty(schema, "letter")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("letter")
    expect(result?.property).toBeDefined()
  })

  it("builds string literal as text with default", () => {
    const result = buildDmlProperty(z.literal("active"), "state")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("state")
    expect(result?.property).toBeDefined()
  })

  it("builds number literal as number with default", () => {
    const result = buildDmlProperty(z.literal(42), "answer")
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("answer")
    expect(result?.property).toBeDefined()
  })

  it("returns null for implicit properties", () => {
    expect(buildDmlProperty(z.date(), "created_at")).toBeNull()
    expect(buildDmlProperty(z.date(), "updated_at")).toBeNull()
    expect(buildDmlProperty(z.date().nullable(), "deleted_at")).toBeNull()
  })

  it("builds belongsTo relationship with metadata options", () => {
    const Customer = zodSchemaToDml(CustomerSchema, { modelName: "Customer" })
    const result = buildDmlProperty(CustomerSchema, "customer", {
      customer: {
        kind: "belongsTo",
        model: () => Customer,
        options: { mappedBy: "orders", nullable: true, searchable: true },
      },
    })
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("customer")
    expect(result?.property).toBeDefined()
  })

  it("builds hasMany relationship with metadata options", () => {
    const Order = zodSchemaToDml(OrderSchema, {
      modelName: "Order",
      flatRelations: { customer: "customer_id" },
    })
    const result = buildDmlProperty(z.array(OrderSchema), "orders", {
      orders: {
        kind: "hasMany",
        model: () => Order,
        options: { mappedBy: "customer", foreignKey: true },
      },
    })
    expect(result).not.toBeNull()
    expect(result?.dmlName).toBe("orders")
    expect(result?.property).toBeDefined()
  })
})
