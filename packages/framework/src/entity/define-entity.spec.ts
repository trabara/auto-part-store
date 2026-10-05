import { z } from "@medusajs/framework/zod"
import { reset } from "../orm/registry"
import { BaseSchema } from "../utils/validation"
import { defineEntities, defineEntity, getEntity, resetEntities } from "./index"
import type { EntityDef } from "./index"
import { findParams, toModel, toModels, validateEntityBody, validateEntityQuery } from "./server"

// Entities are (re)defined per test, so register their names loosely.
declare module "./index" {
  interface EntityRegistry {
    Vehicle: EntityDef
    Engine: EntityDef
    Group: EntityDef
    A: EntityDef
    B: EntityDef
    C: EntityDef
  }
}

beforeEach(() => {
  reset()
  resetEntities()
})

const defineVehicleAndEngine = () => {
  const Vehicle = defineEntity("Vehicle", {
    schema: BaseSchema.extend({ year_start: z.number(), year_end: z.number().nullable() }),
    relations: (r) => ({ engine: r.belongsTo("Engine", { mappedBy: "vehicles" }) }),
    indexes: [{ on: ["engine_id", "year_start"], unique: true }],
    checks: [{ name: "years", expression: "year_end IS NULL OR year_end >= year_start" }],
  })
  const Engine = defineEntity("Engine", {
    schema: BaseSchema.extend({ name: z.string(), power: z.number() }),
    relations: (r) => ({ vehicles: r.hasMany("Vehicle", { mappedBy: "engine" }) }),
  })
  return { Vehicle, Engine }
}

describe("defineEntity: model", () => {
  it("builds scalars, relations, indexes and checks", () => {
    const { Vehicle } = defineVehicleAndEngine()
    const parsed = (toModel(Vehicle) as any).parse()

    expect(parsed.tableName).toBe("vehicle")
    expect(Object.keys(parsed.schema)).toEqual(
      expect.arrayContaining(["id", "year_start", "year_end", "engine"]),
    )
    expect(parsed.schema.engine.type).toBe("belongsTo")
    expect(parsed.checks).toEqual([
      { name: "years", expression: "year_end IS NULL OR year_end >= year_start" },
    ])
    expect(parsed.indexes[0]).toMatchObject({ on: ["engine_id", "year_start"], unique: true })
  })

  it("derives modelName from the entity name and honours tableName", () => {
    const E = defineEntity("FitmentPosition", { schema: BaseSchema, tableName: "positions" })
    expect(E.modelName).toBe("fitment_position")
    expect((toModel(E) as any).parse().tableName).toBe("positions")
  })

  it("resolves relation targets lazily through the registry", () => {
    const { Vehicle, Engine } = defineVehicleAndEngine()
    const engineModel = toModel(Engine)
    const parsed = (toModel(Vehicle) as any).parse()
    expect(parsed.schema.engine.parse("engine").entity()).toBe(engineModel)
  })

  it("defaults display to name when present, else id", () => {
    const { Vehicle, Engine } = defineVehicleAndEngine()
    expect(Engine.display).toBe("name")
    expect(Vehicle.display).toBe("id")
  })
})

describe("defineEntity: validation", () => {
  it("rejects entity-like schema fields", () => {
    expect(() =>
      defineEntity("Bad", {
        schema: BaseSchema.extend({ engine: z.object({ id: z.string() }) }),
      }),
    ).toThrow(/schema field "engine" looks like a relation/)
    expect(() =>
      defineEntity("Bad2", {
        schema: BaseSchema.extend({ items: z.array(z.object({ id: z.string() })) }),
      }),
    ).toThrow(/schema field "items" looks like a relation/)
  })

  it("allows plain object and array fields (json)", () => {
    expect(() =>
      defineEntity("Ok", {
        schema: BaseSchema.extend({
          meta: z.object({ key: z.string() }),
          tags: z.array(z.string()),
        }),
      }),
    ).not.toThrow()
  })

  it("rejects a key declared as both field and relation", () => {
    expect(() =>
      defineEntity("Dup", {
        schema: BaseSchema.extend({ engine: z.string() }),
        relations: (r) => ({ engine: r.belongsTo("Engine") }),
      }),
    ).toThrow(/both as a schema field and as a relation/)
  })

  it("rejects index columns that do not exist", () => {
    expect(() =>
      defineEntity("Idx", { schema: BaseSchema, indexes: ["missing"] }),
    ).toThrow(/index column "missing"/)
  })

  it("rejects duplicate entity names", () => {
    defineEntity("Once", { schema: BaseSchema })
    expect(() => defineEntity("Once", { schema: BaseSchema })).toThrow(/already defined/)
  })
})

describe("defineEntity: DTOs", () => {
  it("create drops server-managed fields and adds FK columns", () => {
    const { Vehicle } = defineVehicleAndEngine()
    expect(Object.keys(Vehicle.dto.create.shape)).toEqual(["year_start", "year_end", "engine_id"])
    expect(() => Vehicle.dto.create.parse({ year_start: 2010, year_end: null })).toThrow()
    expect(
      Vehicle.dto.create.parse({ year_start: 2010, year_end: null, engine_id: "e1", id: "x" }),
    ).toEqual({ year_start: 2010, year_end: null, engine_id: "e1" })
  })

  it("nullable relations give optional, nullable FK columns", () => {
    const Group = defineEntity("Group", {
      schema: BaseSchema,
      relations: (r) => ({ parent: r.belongsTo("Group", { nullable: true }) }),
    })
    expect(Group.dto.create.parse({})).toEqual({})
    expect(Group.dto.create.parse({ parent_id: null })).toEqual({ parent_id: null })
  })

  it("hasMany relations add nothing to the DTOs", () => {
    const { Engine } = defineVehicleAndEngine()
    expect(Object.keys(Engine.dto.create.shape)).toEqual(["name", "power"])
  })

  it("update is partial; batch update requires ids", () => {
    const { Vehicle } = defineVehicleAndEngine()
    expect(Vehicle.dto.update.parse({})).toEqual({})
    expect(() => Vehicle.dto.batchUpdate.parse({ entities: [{ year_start: 1 }] })).toThrow()
    expect(Vehicle.dto.batchUpdate.parse({ entities: [{ id: "v1", year_start: 1 }] })).toEqual({
      entities: [{ id: "v1", year_start: 1 }],
    })
  })
})

describe("defineEntity: query", () => {
  it("lists own fields (with FKs) and relations", () => {
    const { Vehicle } = defineVehicleAndEngine()
    expect(Vehicle.query.fields).toEqual([
      "id",
      "created_at",
      "updated_at",
      "deleted_at",
      "year_start",
      "year_end",
      "engine_id",
    ])
    expect(Vehicle.query.relations).toEqual(["engine"])
  })

  it("find params filter scalars and FK columns", () => {
    const { Vehicle } = defineVehicleAndEngine()
    const parsed = findParams(Vehicle).parse({
      engine_id: "e1",
      year_start: { $gte: "2010" },
    })
    expect(parsed).toMatchObject({ engine_id: "e1", year_start: { $gte: 2010 } })
  })

  it("allowed() covers relations and their own fields", () => {
    const { Vehicle } = defineVehicleAndEngine()
    expect(Vehicle.query.allowed()).toEqual(
      expect.arrayContaining(["year_start", "engine_id", "engine", "engine.power", "engine.id"]),
    )
  })
})

describe("defineEntities", () => {
  it("returns models keyed for MedusaService and looks up by key", () => {
    const { Vehicle, Engine } = defineVehicleAndEngine()
    const set = defineEntities({ Vehicle, Engine })
    expect(toModels(set)).toEqual({ Vehicle: toModel(Vehicle), Engine: toModel(Engine) })
    expect(set.byKey("vehicle")).toBe(Vehicle)
    expect(set.byKey("Engine")).toBe(Engine)
    expect(set.byKey("nope")).toBeUndefined()
    expect(getEntity("Vehicle")).toBe(Vehicle)
  })

  it("reports missing targets, bad mappedBy, wrong inverse target and kinds", () => {
    const A = defineEntity("A", {
      schema: BaseSchema,
      relations: (r) => ({
        // @ts-expect-error — not a registered entity (runtime check below)
        missing: r.belongsTo("Missing"),
        noInverse: r.belongsTo("B", { mappedBy: "nope" }),
        wrongTarget: r.belongsTo("B", { mappedBy: "toC" }),
        wrongKind: r.belongsTo("B", { mappedBy: "toA" }),
      }),
    })
    const B = defineEntity("B", {
      schema: BaseSchema,
      relations: (r) => ({ toC: r.hasMany("C"), toA: r.belongsTo("A") }),
    })
    const C = defineEntity("C", { schema: BaseSchema })

    let message = ""
    try {
      defineEntities({ A, B, C })
    } catch (e: any) {
      message = e.message
    }
    expect(message).toMatch(/A\.missing: target "Missing" is not defined/)
    expect(message).toMatch(/A\.noInverse: mappedBy "nope" is not a relation of "B"/)
    expect(message).toMatch(/A\.wrongTarget: "B\.toC" points to "C", not "A"/)
    expect(message).toMatch(/A\.wrongKind: belongsTo cannot be mapped by belongsTo/)
  })

  it("requires keys to match entity names", () => {
    const { Vehicle } = defineVehicleAndEngine()
    expect(() => defineEntities({ Car: Vehicle } as any)).toThrow(/key "Car" must match/)
  })
})

describe("defineEntity: relations in queries and responses", () => {
  it("allowed(depth) reaches nested relations", () => {
    const { Vehicle } = defineVehicleAndEngine()
    expect(Vehicle.query.allowed()).toEqual(
      expect.arrayContaining(["engine.vehicles", "engine.vehicles.year_start"]),
    )
    expect(Vehicle.query.allowed(1)).not.toContain("engine.vehicles")
  })

  it("withRelations() nests target schemas as optional fields", () => {
    const { Vehicle, Engine } = defineVehicleAndEngine()
    const VehicleRes = Vehicle.withRelations()
    expect(Object.keys(VehicleRes.shape)).toContain("engine")
    expect(
      VehicleRes.parse({ id: "v1", year_start: 1, year_end: null, engine: { id: "e", name: "x", power: 1 } }),
    ).toMatchObject({ engine: { power: 1 } })
    expect(() =>
      Engine.withRelations().parse({ id: "e", name: "x", power: 1, vehicles: [{ id: "v" }] }),
    ).toThrow()
  })
})

describe("validateEntityQuery / validateEntityBody", () => {
  const run = async (middleware: any, req: any) => {
    const next = jest.fn()
    req.allowed ??= []
    await middleware(req, {}, next)
    return { req, err: next.mock.calls[0]?.[0] }
  }

  it("validates exposed entities and 404s the rest", async () => {
    const { Vehicle } = defineVehicleAndEngine()

    const query = validateEntityQuery([Vehicle], { isList: true })
    const ok = await run(query, {
      params: { entity: "vehicle" },
      query: { fields: "*engine,engine.power", engine_id: "e1" },
    })
    expect(ok.err).toBeUndefined()
    expect(ok.req.filterableFields).toEqual({ engine_id: "e1" })
    expect(ok.req.queryConfig.fields).toEqual(expect.arrayContaining(["engine.power"]))

    const hidden = await run(query, { params: { entity: "engine" }, query: {} })
    expect(hidden.err).toMatchObject({ type: "not_found" })

    const body = validateEntityBody([Vehicle], "create")
    const created = await run(body, {
      params: { entity: "vehicle" },
      body: { year_start: 2010, year_end: null, engine_id: "e1" },
    })
    expect(created.err).toBeUndefined()
    expect(created.req.validatedBody).toEqual({ year_start: 2010, year_end: null, engine_id: "e1" })
  })
})

describe("link relations (cross-module)", () => {
  const defineLinked = () => {
    const Vehicle = defineEntity("Vehicle", {
      schema: BaseSchema.extend({ year: z.number() }),
    })
    const Fitment = defineEntity("Fitment", {
      schema: BaseSchema.extend({ notes: z.string().nullable() }),
      relations: (r) => ({ vehicle: r.link("Vehicle") }),
    })
    const Group = defineEntity("Group", {
      schema: BaseSchema,
      relations: (r) => ({ vehicle: r.link("Vehicle", { nullable: true }) }),
    })
    defineEntities({ Vehicle }, { module: "vehicle" })
    defineEntities({ Fitment, Group }, { module: "fitment" })
    return { Vehicle, Fitment, Group }
  }

  it("adds the link key to DTOs but not to columns, fields or filters", () => {
    const { Fitment, Group } = defineLinked()
    expect(Object.keys(Fitment.dto.create.shape)).toEqual(["notes", "vehicle_id"])
    expect(Fitment.dto.create.parse({ notes: null, vehicle_id: "v1" })).toEqual({ notes: null, vehicle_id: "v1" })
    expect(() => Fitment.dto.create.parse({ notes: null })).toThrow()
    expect(Group.dto.create.parse({})).toEqual({})

    expect(Fitment.query.fields).not.toContain("vehicle_id")
    expect(Object.keys(findParams(Fitment).shape)).not.toContain("vehicle_id")
    expect(Object.keys((toModel(Fitment) as any).parse().schema)).not.toContain("vehicle")
  })

  it("allows selecting the linked entity and its fields", () => {
    const { Fitment } = defineLinked()
    expect(Fitment.query.allowed()).toEqual(expect.arrayContaining(["vehicle", "vehicle.year"]))
    expect(Object.keys(Fitment.withRelations().shape)).toContain("vehicle")
  })

  it("records each entity's module", async () => {
    defineLinked()
    const { getEntityModule } = await import("./index")
    expect(getEntityModule("Vehicle")).toBe("vehicle")
    expect(getEntityModule("Fitment")).toBe("fitment")
  })

  it("rejects database relations across modules and links inside one", () => {
    const Vehicle = defineEntity("Vehicle", { schema: BaseSchema })
    const Fitment = defineEntity("Fitment", {
      schema: BaseSchema,
      relations: (r) => ({ vehicle: r.belongsTo("Vehicle") }),
    })
    defineEntities({ Vehicle }, { module: "vehicle" })
    expect(() => defineEntities({ Fitment }, { module: "fitment" })).toThrow(
      /Fitment\.vehicle: "Vehicle" is not in module "fitment"; use r\.link\("Vehicle"\)/,
    )

    const A = defineEntity("A", { schema: BaseSchema, relations: (r) => ({ b: r.link("B") }) })
    const B = defineEntity("B", { schema: BaseSchema })
    expect(() => defineEntities({ A, B }, { module: "same" })).toThrow(
      /A\.b: "B" is in the same module; use a database relation/,
    )
  })

  it("requires a link to be named after the target model", () => {
    const Vehicle = defineEntity("Vehicle", { schema: BaseSchema })
    const Fitment = defineEntity("Fitment", {
      schema: BaseSchema,
      relations: (r) => ({ car: r.link("Vehicle") }),
    })
    defineEntities({ Vehicle }, { module: "vehicle" })
    expect(() => defineEntities({ Fitment }, { module: "fitment" })).toThrow(
      /Fitment\.car: a link to "Vehicle" must be named "vehicle"/,
    )
  })

  it("refuses to move an entity to another module", () => {
    const Vehicle = defineEntity("Vehicle", { schema: BaseSchema })
    defineEntities({ Vehicle }, { module: "vehicle" })
    expect(() => defineEntities({ Vehicle }, { module: "other" })).toThrow(/already in module "vehicle"/)
  })
})
