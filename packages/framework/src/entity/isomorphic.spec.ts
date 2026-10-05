/**
 * Guard: the isomorphic entity entry (imported by admin code) must not load
 * server modules. Each server module below throws as soon as it is imported.
 */
jest.mock("@medusajs/framework/utils", () => {
  throw new Error("server-only module imported: @medusajs/framework/utils")
})
jest.mock("@medusajs/framework/http", () => {
  throw new Error("server-only module imported: @medusajs/framework/http")
})
jest.mock("@medusajs/framework/workflows-sdk", () => {
  throw new Error("server-only module imported: @medusajs/framework/workflows-sdk")
})
jest.mock("@medusajs/medusa/api/utils/validators", () => {
  throw new Error("server-only module imported: @medusajs/medusa validators")
})

describe("@repo/framework/entity (isomorphic)", () => {
  it("the other admin-facing entries (utils, core) load without server modules", async () => {
    await expect(import("../utils")).resolves.toBeDefined()
    await expect(import("../core")).resolves.toBeDefined()
  })

  it("defines entities and derives DTOs/query metadata without server modules", async () => {
    const { z } = await import("@medusajs/framework/zod")
    const { defineEntities, defineEntity } = await import("./index")

    const Engine = defineEntity("IsoEngine", {
      schema: z.object({ id: z.string(), name: z.string(), power: z.number() }),
      relations: (r: any) => ({ vehicles: r.hasMany("IsoVehicle", { mappedBy: "engine" }) }),
    })
    const Vehicle = defineEntity("IsoVehicle", {
      schema: z.object({ id: z.string(), year: z.number() }),
      relations: (r: any) => ({ engine: r.belongsTo("IsoEngine", { mappedBy: "vehicles" }) }),
      indexes: [{ on: ["engine_id"] }],
    })
    const set = defineEntities({ IsoEngine: Engine, IsoVehicle: Vehicle })

    expect(Object.keys(Vehicle.dto.create.shape)).toEqual(["year", "engine_id"])
    expect(Vehicle.query.allowed()).toEqual(expect.arrayContaining(["engine", "engine.power"]))
    expect(Object.keys(Vehicle.withRelations().shape)).toContain("engine")
    expect(set.byKey("iso_vehicle")).toBe(Vehicle)
  })

  it("the guard bites: the server entry fails to load", async () => {
    await expect(import("./server")).rejects.toThrow(/server-only module imported/)
  })
})
