import { z } from "@medusajs/framework/zod"
import type { DmlEntity } from "@medusajs/framework/utils"
import { normalizeRelationship } from "./normalize-relationship"
import type { RelationshipDef, RelationshipKind } from "../types"

function mockResolver(): DmlEntity<any, any> {
  return { name: "MockEntity" } as unknown as DmlEntity<any, any>
}

function mockMetadata(kind: RelationshipKind, options?: Record<string, unknown>): RelationshipDef {
  return {
    kind,
    model: mockResolver,
    options: options as never,
  }
}

describe("normalizeRelationship", () => {
  it("returns null for null input", () => {
    expect(normalizeRelationship(null)).toBeNull()
  })

  it("returns null for undefined input", () => {
    expect(normalizeRelationship(undefined)).toBeNull()
  })

  it("normalizes a shorthand resolver using an object schema to belongsTo", () => {
    const schema = z.object({ id: z.string() })
    const result = normalizeRelationship(mockResolver, schema)

    expect(result).toEqual({
      kind: "belongsTo",
      model: mockResolver,
    })
  })

  it("normalizes a shorthand resolver using an array-of-objects schema to hasMany", () => {
    const schema = z.array(z.object({ id: z.string() }))
    const result = normalizeRelationship(mockResolver, schema)

    expect(result).toEqual({
      kind: "hasMany",
      model: mockResolver,
    })
  })

  it("defaults shorthand kind to belongsTo when no schema is provided", () => {
    const result = normalizeRelationship(mockResolver)

    expect(result).toEqual({
      kind: "belongsTo",
      model: mockResolver,
    })
  })

  it("defaults shorthand kind to belongsTo for non-relationship schemas", () => {
    const result = normalizeRelationship(mockResolver, z.string())

    expect(result).toEqual({
      kind: "belongsTo",
      model: mockResolver,
    })
  })

  it("returns a metadata object unchanged", () => {
    const metadata = mockMetadata("hasOne", { mappedBy: "profile" })
    const result = normalizeRelationship(metadata)

    expect(result).toEqual(metadata)
  })

  it("preserves manyToMany metadata options", () => {
    const metadata = mockMetadata("manyToMany", {
      mappedBy: "items",
      pivotTable: "order_item",
      joinColumn: "order_id",
      inverseJoinColumn: "item_id",
    })
    const result = normalizeRelationship(metadata)

    expect(result).toEqual(metadata)
  })
})
