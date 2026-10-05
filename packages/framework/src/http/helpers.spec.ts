import { z } from "@medusajs/framework/zod"
import {
  buildEntityFilters,
  validateAndTransformEntityBody,
  validateAndTransformEntityQuery,
  zodAllowedFields,
} from "./helpers"

const Engine = z.object({
  id: z.string(),
  fuel: z.enum(["GASOLINE", "DIESEL"]).default("GASOLINE"),
  power: z.number(),
  turbo: z.boolean(),
  tags: z.array(z.string()),
})

const Vehicle = z.object({
  id: z.string(),
  year_start: z.number(),
  engine: z.lazy(() => Engine),
})

async function run(middleware: any, req: any) {
  const next = jest.fn()
  req.allowed ??= [] // set by Medusa on real requests
  await middleware(req, {}, next)
  return { req, err: next.mock.calls[0]?.[0] }
}

describe("buildEntityFilters", () => {
  it("builds operator filters for scalar fields and skips relations", () => {
    expect(Object.keys(buildEntityFilters(Vehicle))).toEqual(["id", "year_start"])
  })

  it("does not inject schema defaults into filters", () => {
    const filters = z.object(buildEntityFilters(Engine))
    expect(filters.parse({})).toEqual({})
  })
})

describe("zodAllowedFields", () => {
  it("includes leaf paths and relation prefixes", () => {
    expect(zodAllowedFields(Vehicle)).toEqual(
      expect.arrayContaining(["id", "year_start", "engine", "engine.power"]),
    )
  })
})

describe("validateAndTransformEntityQuery", () => {
  const middleware = validateAndTransformEntityQuery({ vehicle: Vehicle, VehicleEngine: Engine })

  it("passes a 404 MedusaError to next for an unknown entity", async () => {
    const { err } = await run(middleware, { params: { entity: "nope" }, query: {} })
    expect(err).toMatchObject({ type: "not_found" })
  })

  it("puts filters at the top level of filterableFields, coerced", async () => {
    const { req, err } = await run(middleware, {
      params: { entity: "vehicle" },
      query: { year_start: { $gte: "2010" } },
    })
    expect(err).toBeUndefined()
    expect(req.filterableFields).toEqual({ year_start: { $gte: 2010 } })
  })

  it("resolves entity keys through snake_case", async () => {
    const { req, err } = await run(middleware, {
      params: { entity: "vehicle-engine" },
      query: { turbo: "true" },
    })
    expect(err).toBeUndefined()
    expect(req.filterableFields).toEqual({ turbo: true })
  })

  it("reports bad JSON in an array filter as a validation error", async () => {
    const { err } = await run(middleware, {
      params: { entity: "vehicle_engine" },
      query: { tags: "[not json" },
    })
    expect(err).toMatchObject({ type: "invalid_data" })
  })

  it("strips fields outside the schema", async () => {
    const { req, err } = await run(middleware, {
      params: { entity: "vehicle" },
      query: { fields: "id,secret" },
    })
    expect(err).toBeUndefined()
    expect(req.queryConfig.fields).toContain("id")
    expect(req.queryConfig.fields).not.toContain("secret")
  })

  it("allows selecting a whole relation", async () => {
    const { err } = await run(middleware, {
      params: { entity: "vehicle" },
      query: { fields: "*engine" },
    })
    expect(err).toBeUndefined()
  })
})

describe("validateAndTransformEntityBody", () => {
  const middleware = validateAndTransformEntityBody({ vehicle_engine: Engine })

  it("passes a 404 MedusaError to next for an unknown entity", async () => {
    const { err } = await run(middleware, { params: { entity: "nope" }, body: {} })
    expect(err).toMatchObject({ type: "not_found" })
  })

  it("validates the body with the entity's schema", async () => {
    const { req, err } = await run(middleware, {
      params: { entity: "vehicle_engine" },
      body: { id: "e1", power: 100, turbo: false, tags: [] },
    })
    expect(err).toBeUndefined()
    expect(req.validatedBody).toMatchObject({ id: "e1", fuel: "GASOLINE" })
  })
})
