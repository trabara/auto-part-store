import { z } from "@medusajs/framework/zod"
import { validateOptionKeys } from "./option-keys"

describe("validateOptionKeys", () => {
  const BaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    customer: z.object({ id: z.string() }),
    items: z.array(z.object({ id: z.string() })),
  })

  it("passes with empty options", () => {
    expect(() => validateOptionKeys(BaseSchema, { modelName: "Base" })).not.toThrow()
  })

  it("passes with valid flatRelations keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        flatRelations: { customer: "customer_id" },
      }),
    ).not.toThrow()
  })

  it("throws on a typo in flatRelations keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        flatRelations: { custommer: "customer_id" },
      }),
    ).toThrow(/custommer/)
  })

  it("passes with valid relationships keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        relationships: { customer: () => ({}) as any },
      }),
    ).not.toThrow()
  })

  it("throws on a typo in relationships keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        relationships: { custommer: () => ({}) as any },
      }),
    ).toThrow(/custommer/)
  })

  it("passes with valid cascadeDelete keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        cascadeDelete: ["items"],
      }),
    ).not.toThrow()
  })

  it("throws on a typo in cascadeDelete keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        cascadeDelete: ["itemms"],
      }),
    ).toThrow(/itemms/)
  })

  it("passes with valid string indexes", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        indexes: ["name", "email"],
      }),
    ).not.toThrow()
  })

  it("passes with valid DmlIndex objects", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        indexes: [{ on: ["name", "email"] }],
      }),
    ).not.toThrow()
  })

  it("throws on a typo in index keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        indexes: ["nme"],
      }),
    ).toThrow(/nme/)
  })

  it("throws on a typo in DmlIndex on keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        indexes: [{ on: ["nme"] }],
      }),
    ).toThrow(/nme/)
  })

  it("allows remapped flatRelations column names in indexes", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        flatRelations: { customer: "customer_id" },
        indexes: ["customer_id"],
      }),
    ).not.toThrow()
  })

  it("rejects original flatRelations keys when used in indexes", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        flatRelations: { customer: "customer_id" },
        indexes: ["customer"],
      }),
    ).toThrow(/customer/)
  })

  it("throws a single error containing multiple typos", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        flatRelations: { custommer: "customer_id" },
        relationships: { custommer: () => ({}) as any },
        cascadeDelete: ["itemms"],
        indexes: ["nme"],
      }),
    ).toThrow(/custommer.*itemms.*nme/)
  })

  it("throws a clear error with allowed schema keys", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        indexes: ["nme"],
      }),
    ).toThrow(/id.*name.*email.*customer.*items/)
  })

  it("handles arrays of primitive values as json fields", () => {
    const TagSchema = z.object({
      id: z.string(),
      tags: z.array(z.string()),
    })
    expect(() =>
      validateOptionKeys(TagSchema, {
        modelName: "Tag",
        indexes: ["tags"],
      }),
    ).not.toThrow()
  })

  it("treats __proto__ as a regular unknown key", () => {
    expect(() =>
      validateOptionKeys(BaseSchema, {
        modelName: "Base",
        cascadeDelete: ["__proto__"],
      }),
    ).toThrow(/__proto__/)
  })
})
