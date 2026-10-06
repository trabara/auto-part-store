import { z } from "@medusajs/framework/zod"
import { reset } from "../orm/registry"
import { BaseSchema } from "../utils/validation"
import { defineEntity, resetEntities } from "./index"
import type { EntityDef } from "./index"
import { searchFilter, searchPaths } from "./server"

declare module "./index" {
  interface EntityRegistry {
    Vehicle: EntityDef
    Engine: EntityDef
    Fitment: EntityDef
  }
}

beforeEach(() => {
  reset()
  resetEntities()
})

const define = () => {
  defineEntity("Engine", { schema: BaseSchema.extend({ code: z.string().nullable(), power: z.number() }) })
  const Vehicle = defineEntity("Vehicle", {
    schema: BaseSchema.extend({ trim: z.string().nullable(), year: z.number() }),
    relations: (r) => ({ engine: r.belongsTo("Engine") }),
    label: { fields: ["trim", "year", "engine.code", "engine.power"], format: () => "" },
  })
  const Fitment = defineEntity("Fitment", {
    schema: BaseSchema,
    relations: (r) => ({ vehicle: r.link("Vehicle", { storage: "column" }) }),
    label: { fields: ["vehicle.trim"], format: () => "" },
  })
  return { Vehicle, Fitment }
}

describe("searchPaths", () => {
  it("keeps the label's text fields, nested ones included", () => {
    expect(searchPaths(define().Vehicle)).toEqual(["trim", "engine.code"])
  })

  it("never crosses a module link", () => {
    expect(searchPaths(define().Fitment)).toEqual([])
  })

  it("can be set explicitly", () => {
    const E = defineEntity("Engine", { schema: BaseSchema.extend({ code: z.string(), note: z.string() }), search: ["note"] })
    expect(searchPaths(E)).toEqual(["note"])
  })
})

describe("searchFilter", () => {
  it("requires every word to match one path, case-insensitively", () => {
    expect(searchFilter(define().Vehicle, "  gti  CJSA ")).toEqual({
      $and: [
        { $or: [{ trim: { $ilike: "%gti%" } }, { engine: { code: { $ilike: "%gti%" } } }] },
        { $or: [{ trim: { $ilike: "%CJSA%" } }, { engine: { code: { $ilike: "%CJSA%" } } }] },
      ],
    })
  })

  it("escapes LIKE wildcards and ignores empty searches", () => {
    const { Vehicle, Fitment } = define()
    expect(searchFilter(Vehicle, "50%")).toEqual({
      $or: [{ trim: { $ilike: "%50\\%%" } }, { engine: { code: { $ilike: "%50\\%%" } } }],
    })
    expect(searchFilter(Vehicle, "  ")).toBeUndefined()
    expect(searchFilter(Fitment, "x")).toBeUndefined()
  })
})
