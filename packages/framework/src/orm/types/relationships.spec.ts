import type { RelationshipOptions, RelationshipDef, DmlRelDef } from "./fields"

describe("relationship types", () => {
  it("accepts all four Medusa relationship kinds", () => {
    const hasOne: RelationshipDef = { kind: "hasOne", target: "Profile" }
    const hasMany: RelationshipDef = { kind: "hasMany", target: "Order" }
    const belongsTo: RelationshipDef = { kind: "belongsTo", target: "Customer" }
    const manyToMany: RelationshipDef = { kind: "manyToMany", target: "Tag" }

    expect([hasOne.kind, hasMany.kind, belongsTo.kind, manyToMany.kind]).toEqual([
      "hasOne",
      "hasMany",
      "belongsTo",
      "manyToMany",
    ])
  })

  it("accepts relationship options", () => {
    const options: RelationshipOptions = {
      mappedBy: "user",
      nullable: true,
      searchable: true,
      foreignKey: true,
      pivotTable: "user_tags",
      joinColumn: "user_id",
      inverseJoinColumn: "tag_id",
    }

    const rel: RelationshipDef = { kind: "manyToMany", target: "Tag", options }
    expect(rel.options?.mappedBy).toBe("user")
  })

  it("preserves backward-compatible DmlRelDef shape", () => {
    const legacy: DmlRelDef = {
      kind: "belongsTo",
      target: "Customer",
      targetModelName: "Customer",
    }

    expect(legacy.kind).toBe("belongsTo")
  })

  it("supports json relation marker", () => {
    const json: DmlRelDef = { kind: "json" }
    expect(json.kind).toBe("json")
  })
})
