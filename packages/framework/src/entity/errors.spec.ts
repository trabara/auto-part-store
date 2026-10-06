import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { reset } from "../orm/registry"
import { BaseSchema } from "../utils/validation"
import { defineEntity, resetEntities } from "./index"
import type { EntityDef } from "./index"
import { constraintViolationMessage, uniqueViolationMessage, withReadableErrors } from "./server"

declare module "./index" {
  interface EntityRegistry {
    Engine: EntityDef
    Vehicle: EntityDef
  }
}

beforeEach(() => {
  reset()
  resetEntities()
})

// Messages as produced by Medusa's dbErrorMapper.
const violation = (detail: string, table = "Vehicle make") =>
  new MedusaError(MedusaError.Types.INVALID_DATA, `${table} with ${detail}, already exists.`)

describe("uniqueViolationMessage", () => {
  const defineMake = () =>
    defineEntity("VehicleMake" as any, {
      schema: BaseSchema.extend({ name: z.string(), slug: z.string().nullable() }),
    })

  it("builds a readable default from the violated columns", () => {
    const Make = defineMake()
    expect(uniqueViolationMessage(Make, violation("name: Toyota"))).toBe(
      "A vehicle make with this name already exists.",
    )
    // Expression index (lower(name)) reduces to the column.
    expect(uniqueViolationMessage(Make, violation("lower(name::text): toyota"))).toBe(
      "A vehicle make with this name already exists.",
    )
  })

  it("lists three or more columns with commas", () => {
    const Engine = defineEntity("Engine", {
      schema: BaseSchema.extend({ fuel: z.string(), size: z.string(), power: z.number() }),
    })
    expect(
      uniqueViolationMessage(Engine, violation("fuel: DIESEL, size: 2.0, power: 150", "Engine")),
    ).toBe("An engine with this fuel, size and power already exists.")
  })

  it("names FK columns without _id and joins several", () => {
    const Engine = defineEntity("Engine", { schema: BaseSchema.extend({ name: z.string() }) })
    const Model = defineEntity("Vehicle", {
      schema: BaseSchema.extend({ name: z.string() }),
      relations: (r) => ({ engine: r.belongsTo("Engine") }),
    })
    expect(Engine).toBeDefined()
    expect(
      uniqueViolationMessage(Model, violation("engine_id: e1, lower(name::text): golf", "Vehicle")),
    ).toBe("A vehicle with this engine and name already exists.")
    expect(uniqueViolationMessage(Model, violation("engine_id: e1, name: Golf, GTI", "Vehicle"))).toBe(
      "A vehicle with this engine and name already exists.",
    )
  })

  it("uses the entity's message for the violated columns", () => {
    const Engine = defineEntity("Engine", {
      schema: BaseSchema.extend({ fuel: z.string(), size: z.string(), power: z.number() }),
      messages: {
        unique: [{ on: ["fuel", "size", "power"], message: "This engine already exists." }],
      },
    })
    expect(
      uniqueViolationMessage(Engine, violation("fuel: DIESEL, size: 2.0, power: 150", "Engine")),
    ).toBe("This engine already exists.")
    expect(uniqueViolationMessage(Engine, violation("fuel: DIESEL", "Engine"))).toBe(
      "An engine with this fuel already exists.",
    )
    expect(uniqueViolationMessage(Engine, violation("fuel: DIESEL, size: 2.0", "Engine"))).toBe(
      "An engine with this fuel and size already exists.",
    )
  })

  it("ignores other errors", () => {
    const Make = defineMake()
    expect(uniqueViolationMessage(Make, new Error("boom"))).toBeUndefined()
    expect(uniqueViolationMessage(Make, undefined)).toBeUndefined()
  })

  it("rejects message columns that don't exist", () => {
    expect(() =>
      defineEntity("Engine", {
        schema: BaseSchema,
        messages: { unique: [{ on: ["nope"], message: "x" }] },
      }),
    ).toThrow(/messages.unique column "nope"/)
  })
})

describe("withReadableErrors", () => {
  it("rethrows unique violations as INVALID_DATA with the readable message", async () => {
    const Engine = defineEntity("Engine", { schema: BaseSchema.extend({ name: z.string() }) })
    await expect(
      withReadableErrors(Engine, async () => {
        throw violation("name: V8", "Engine")
      }),
    ).rejects.toMatchObject({ type: MedusaError.Types.INVALID_DATA, message: "An engine with this name already exists." })
    await expect(withReadableErrors(Engine, async () => 1)).resolves.toBe(1)
    await expect(
      withReadableErrors(Engine, async () => {
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")
  })
})

describe("constraintViolationMessage", () => {
  // Raw driver messages, as Medusa passes check / exclusion violations through.
  const raw = (kind: string, name: string) =>
    new Error(`update "engine" set … - new row for relation "engine" violates ${kind} constraint "${name}"`)

  it("uses the entity's message for the constraint, else a generic one", () => {
    const Engine = defineEntity("Engine", {
      schema: BaseSchema.extend({ a: z.number() }),
      messages: { constraints: { year_range_check: "The last year can't be before the first." } },
    })
    expect(constraintViolationMessage(Engine, raw("check", "year_range_check"))).toBe(
      "The last year can't be before the first.",
    )
    expect(constraintViolationMessage(Engine, raw("check", "power_positive_check"))).toBe(
      "Invalid engine: power positive.",
    )
    expect(constraintViolationMessage(Engine, raw("exclusion", "engine_overlap"))).toBe(
      "This conflicts with an existing engine.",
    )
    expect(constraintViolationMessage(Engine, new Error("boom"))).toBeUndefined()
  })

  it("is applied by withReadableErrors", async () => {
    const Engine = defineEntity("Engine", { schema: BaseSchema })
    await expect(
      withReadableErrors(Engine, async () => {
        throw raw("exclusion", "x")
      }),
    ).rejects.toMatchObject({ type: MedusaError.Types.INVALID_DATA, message: "This conflicts with an existing engine." })
  })
})
