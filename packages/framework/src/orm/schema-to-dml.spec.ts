import { z } from "@medusajs/framework/zod"
import { zodSchemaToDml } from "./schema-to-dml"
import {
  SimpleSchema,
  FullSchema,
  CustomerSchema,
  OrderSchema,
  getEntitySchema,
} from "./_test-utils"

describe("zodSchemaToDml", () => {
  it("builds a DmlEntity", () => {
    const User = zodSchemaToDml(SimpleSchema, { modelName: "User" })
    expect(User).toBeDefined()
    expect(User.name).toBe("User")
    const schema = getEntitySchema(User)
    expect(schema.id).toBeDefined()
    expect(schema.name).toBeDefined()
    expect(schema.email).toBeDefined()
  })

  it("derives table name from modelName", () => {
    const User = zodSchemaToDml(SimpleSchema, { modelName: "User" })
    expect(User.name).toBe("User")
    const parsed = (User as any).parse()
    expect(parsed.tableName).toBe("user")
  })

  it("uses explicit tableName when provided", () => {
    const User = zodSchemaToDml(SimpleSchema, {
      modelName: "User",
      tableName: "users",
    })
    const parsed = (User as any).parse()
    expect(parsed.tableName).toBe("users")
  })

  it("applies cascades and indexes", () => {
    const User = zodSchemaToDml(SimpleSchema, {
      modelName: "User",
      cascadeDelete: ["email"],
      indexes: ["email", "name"],
    })
    const parsed = (User as any).parse()
    expect(parsed.cascades).toEqual({ delete: ["email"] })
    expect(parsed.indexes).toEqual([
      { on: ["email"], unique: false, where: "deleted_at IS NULL" },
      { on: ["name"], unique: false, where: "deleted_at IS NULL" },
    ])
  })

  it("applies check constraints and named indexes", () => {
    const User = zodSchemaToDml(SimpleSchema, {
      modelName: "User",
      indexes: [{ name: "user_name_unique", on: ["name"], unique: true }],
      checks: [{ name: "name_not_empty", expression: "length(name) > 0" }],
    })
    const parsed = (User as any).parse()
    expect(parsed.checks).toEqual([
      { name: "name_not_empty", expression: "length(name) > 0" },
    ])
    expect(parsed.indexes[0]).toMatchObject({
      name: "user_name_unique",
      on: ["name"],
      unique: true,
    })
  })

  it("resolves belongsTo relationships via relationships option", () => {
    const Customer = zodSchemaToDml(CustomerSchema, { modelName: "Customer" })
    const Order = zodSchemaToDml(OrderSchema, {
      modelName: "Order",
      relationships: { customer: () => Customer },
    })
    const schema = getEntitySchema(Order)
    expect(schema.customer).toBeDefined()
    expect(schema.id).toBeDefined()
    expect(schema.created_at).toBeDefined()
  })

  it("resolves z.lazy() in Zod schemas", () => {
    const ServiceSchema = z.object({
      id: z.string(),
    })
    const DeviceSchema = z.object({
      id: z.string(),
      services: z.array(z.lazy(() => ServiceSchema)),
    })

    const Service = zodSchemaToDml(ServiceSchema, { modelName: "Service" })
    const Device = zodSchemaToDml(DeviceSchema, {
      modelName: "Device",
      relationships: { services: () => Service },
    })

    expect(Service).toBeDefined()
    expect(Device).toBeDefined()
    expect(getEntitySchema(Device).services).toBeDefined()
  })

  it("throws when an entity-like field has no relationship config", () => {
    expect(() => zodSchemaToDml(OrderSchema, { modelName: "Order" })).toThrow(
      /Field "customer" looks like a belongsTo relation/,
    )
  })

  it("falls back primitive array to json", () => {
    const Full = zodSchemaToDml(FullSchema, { modelName: "Full" })
    const schema = getEntitySchema(Full)
    expect(schema.tags).toBeDefined()
  })

  it("flattens nested entity fields via flatRelations", () => {
    const NestedSchema = z.object({
      id: z.string(),
      customer: z.object({ id: z.string() }),
    })
    const model = zodSchemaToDml(NestedSchema, {
      modelName: "order",
      flatRelations: { customer: "customer_id" },
    })
    const schema = getEntitySchema(model)
    expect(schema.customer_id).toBeDefined()
    expect(schema.customer).toBeUndefined()
  })

  it("flattens nullable nested fields via flatRelations", () => {
    const NestedSchema = z.object({
      id: z.string(),
      assignee: z.object({ id: z.string() }).optional(),
    })
    const model = zodSchemaToDml(NestedSchema, {
      modelName: "task",
      flatRelations: { assignee: "assignee_id" },
    })
    const schema = getEntitySchema(model)
    expect(schema.assignee_id).toBeDefined()
  })

  it("applies composite indexes", () => {
    const model = zodSchemaToDml(SimpleSchema, {
      modelName: "User",
      indexes: [{ on: ["name", "email"] }],
    })
    const parsed = (model as any).parse()
    expect(parsed.indexes).toEqual(
      expect.arrayContaining([expect.objectContaining({ on: ["name", "email"] })]),
    )
  })

  it("applies unique indexes", () => {
    const model = zodSchemaToDml(SimpleSchema, {
      modelName: "User",
      indexes: [{ on: ["email"], unique: true }],
    })
    const parsed = (model as any).parse()
    expect(parsed.indexes).toEqual(
      expect.arrayContaining([expect.objectContaining({ on: ["email"], unique: true })]),
    )
  })

  it("applies index with where clause", () => {
    const model = zodSchemaToDml(SimpleSchema, {
      modelName: "User",
      indexes: [{ on: ["name"], where: "deleted_at IS NULL" }],
    })
    const parsed = (model as any).parse()
    expect(parsed.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ on: ["name"], where: "deleted_at IS NULL" }),
      ]),
    )
  })

  it("ignores implicit properties when building fields map", () => {
    const ImplicitOnly = z.object({
      id: z.string(),
      created_at: z.date(),
      updated_at: z.date(),
      deleted_at: z.date().nullable(),
    })
    const model = zodSchemaToDml(ImplicitOnly, { modelName: "Audit" })
    expect(model).toBeDefined()
    expect(getEntitySchema(model).id).toBeDefined()
  })

  it("accepts relationship metadata objects", () => {
    const Customer = zodSchemaToDml(CustomerSchema, { modelName: "Customer" })
    const Order = zodSchemaToDml(OrderSchema, {
      modelName: "Order",
      relationships: {
        customer: {
          model: () => Customer,
          kind: "belongsTo",
          options: { mappedBy: "orders" },
        },
      },
    })
    const schema = getEntitySchema(Order)
    expect(schema.customer).toBeDefined()
    expect(schema.id).toBeDefined()
  })

  it("applies nullable and searchable to relationship metadata", () => {
    const Customer = zodSchemaToDml(CustomerSchema, { modelName: "Customer" })
    const Order = zodSchemaToDml(OrderSchema, {
      modelName: "Order",
      relationships: {
        customer: {
          model: () => Customer,
          kind: "belongsTo",
          options: { nullable: true, searchable: true },
        },
      },
    })
    const schema = getEntitySchema(Order)
    expect(schema.customer).toBeDefined()
  })

  it("applies foreignKey to relationship metadata", () => {
    const Customer = zodSchemaToDml(CustomerSchema, { modelName: "Customer" })
    const Order = zodSchemaToDml(OrderSchema, {
      modelName: "Order",
      relationships: {
        customer: {
          model: () => Customer,
          kind: "belongsTo",
          options: { foreignKey: true },
        },
      },
    })
    const schema = getEntitySchema(Order)
    expect(schema.customer).toBeDefined()
  })
})
