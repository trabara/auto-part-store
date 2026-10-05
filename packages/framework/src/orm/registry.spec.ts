import { z } from "@medusajs/framework/zod"
import { define, ref, createModel, reset } from "./registry"
import { zodSchemaToDml } from "./schema-to-dml"

const SimpleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

const ChildSchema = z.object({
  id: z.string(),
  parent_ref: z.object({ id: z.string() }).optional(),
})

const ParentSchema = z.object({
  id: z.string(),
  children: z.array(ChildSchema),
})

beforeEach(() => {
  reset()
})

// ─── define ──────────────────────────────────────────────────

describe("define", () => {
  it("throws when a different entity is registered under the same name", () => {
    define("Dup", zodSchemaToDml(SimpleSchema, { modelName: "dup" }))
    expect(() =>
      define("Dup", zodSchemaToDml(SimpleSchema, { modelName: "dup" })),
    ).toThrow(/already registered/)
  })

  it("allows re-registering the same entity", () => {
    const entity = zodSchemaToDml(SimpleSchema, { modelName: "same" })
    define("Same", entity)
    expect(() => define("Same", entity)).not.toThrow()
  })

  it("registers an entity and returns it unchanged", () => {
    const entity = zodSchemaToDml(SimpleSchema, { modelName: "test" })
    const result = define("Test", entity)
    expect(result).toBe(entity)
  })
})

// ─── ref ─────────────────────────────────────────────────────

describe("ref", () => {
  it("returns a getter that resolves a registered model", () => {
    const entity = zodSchemaToDml(SimpleSchema, { modelName: "test" })
    define("Target", entity)
    expect(ref("Target")()).toBe(entity)
  })

  it("throws when the model is not registered", () => {
    expect(() => ref("Unknown")()).toThrow(/Unknown/)
  })

  it("lists registered models in the error message", () => {
    define("Alpha", zodSchemaToDml(SimpleSchema, { modelName: "a" }))
    define("Beta", zodSchemaToDml(SimpleSchema, { modelName: "b" }))
    const err = () => ref("Gamma")()
    expect(err).toThrow(/Alpha/)
    expect(err).toThrow(/Beta/)
    expect(err).toThrow(/Gamma/)
  })
})

// ─── createModel ─────────────────────────────────────────────

describe("createModel", () => {
  it("creates and registers a DML model", () => {
    const model = createModel("Simple", SimpleSchema)
    expect(model).toBeDefined()
    expect(ref("Simple")()).toBe(model as any)
  })

  it("derives modelName as snake_case of name", () => {
    const model = createModel("SimpleEntity", SimpleSchema)
    // model.define receives "simple_entity" as the tableName
    const parsed = (model as any).parse()
    expect(parsed.tableName).toBe("simple_entity")
  })

  it("passes flatRelations through to zodSchemaToDml", () => {
    const Nested = z.object({
      id: z.string(),
      customer: z.object({ id: z.string() }),
    })
    const model = createModel("Order", Nested, {
      flatRelations: { customer: "customer_id" },
    })
    const schema = (model as any).schema ?? {}
    expect(schema.customer_id).toBeDefined()
    expect(schema.customer).toBeUndefined()
  })

  it("passes indexes through to zodSchemaToDml", () => {
    const model = createModel("Indexed", SimpleSchema, {
      indexes: [{ on: ["name"] }],
    })
    const parsed = (model as any).parse()
    expect(parsed.indexes).toBeDefined()
    expect(parsed.indexes[0]?.on).toContain("name")
  })

  it("passes cascadeDelete through to zodSchemaToDml", () => {
    const model = createModel("Cascaded", SimpleSchema, {
      cascadeDelete: ["name"],
    })
    const parsed = (model as any).parse()
    expect(parsed.cascades?.delete).toContain("name")
  })

  it("supports circular model references via ref()", () => {
    // Define Parent first — it uses a forward ref to Child
    const Parent = createModel("Parent", ParentSchema, {
      relationships: { children: ref("Child") },
    })
    // Child references Parent via a lazy getter (already registered)
    const Child = createModel("Child", ChildSchema, {
      relationships: { parent_ref: ref("Parent") },
    })

    expect(Parent).toBeDefined()
    expect(Child).toBeDefined()
    expect(ref("Parent")()).toBe(Parent as any)
    expect(ref("Child")()).toBe(Child as any)
  })

  it("accepts relationships with direct factory functions (no registry)", () => {
    const Child = createModel("Child", ChildSchema, {
      flatRelations: { parent_ref: "parent_ref_id" },
    })
    const Parent = createModel("Parent", ParentSchema, {
      relationships: { children: () => Child },
    })
    expect(Parent).toBeDefined()
    expect(Child).toBeDefined()
  })
})

// ─── reset ───────────────────────────────────────────────────

describe("reset", () => {
  it("clears all registered models", () => {
    define("A", zodSchemaToDml(SimpleSchema, { modelName: "a" }))
    define("B", zodSchemaToDml(SimpleSchema, { modelName: "b" }))
    reset()
    expect(() => ref("A")()).toThrow()
    expect(() => ref("B")()).toThrow()
  })

  it("allows re-registration after reset", () => {
    define("X", zodSchemaToDml(SimpleSchema, { modelName: "x" }))
    reset()
    const entity = zodSchemaToDml(SimpleSchema, { modelName: "x" })
    define("X", entity)
    expect(ref("X")()).toBe(entity)
  })
})
