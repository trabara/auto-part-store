import { z } from "@medusajs/framework/zod"
import { reset } from "../orm/registry"
import { BaseSchema } from "../utils/validation"
import { defineEntity, resetEntities, withDerived } from "./index"
import type { EntityDef } from "./index"
import { compensateHooks, resetEntityHooks, runDeletingHooks, runHooks } from "./hooks"
import { normalizeDerivedFilters, onEntity } from "./server"

declare module "./index" {
  interface EntityRegistry {
    Engine: EntityDef
  }
}

beforeEach(() => {
  reset()
  resetEntities()
  resetEntityHooks()
})

const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "")

const defineNumber = () =>
  defineEntity("Engine", {
    schema: BaseSchema.extend({
      number: z.string(),
      number_normalized: z.string(),
      option_value_id: z.string().nullable(),
    }),
    derived: { number_normalized: { from: ["number"], compute: (r) => normalize(r.number) } },
    readOnly: ["option_value_id"],
  })

describe("derived and read-only fields", () => {
  it("are left out of the DTOs but stay columns", () => {
    const E = defineNumber()
    expect(Object.keys(E.dto.create.shape)).toEqual(["number"])
    expect(E.readOnly).toEqual(["option_value_id", "number_normalized"])
    expect(E.query.fields).toEqual(expect.arrayContaining(["number_normalized", "option_value_id"]))
  })

  it("are computed when every source is present", () => {
    const E = defineNumber()
    expect(withDerived(E, { number: "04465-02220" })).toEqual({
      number: "04465-02220",
      number_normalized: "0446502220",
    })
    expect(withDerived(E, { other: 1 })).toEqual({ other: 1 })
  })

  it("normalize filters on single-source derived fields, keeping like wildcards", () => {
    const E = defineNumber()
    expect(normalizeDerivedFilters(E, { number_normalized: "04465 02220", number: "x" })).toEqual({
      number_normalized: "0446502220",
      number: "x",
    })
    expect(normalizeDerivedFilters(E, { number_normalized: { $ilike: "%04465 02%" } })).toEqual({
      number_normalized: { $ilike: "%0446502%" },
    })
    expect(normalizeDerivedFilters(E, { number_normalized: ["a-1", "b 2"] })).toEqual({
      number_normalized: ["A1", "B2"],
    })
  })

  it("reject unknown derived, source and read-only fields", () => {
    expect(() =>
      defineEntity("Engine", {
        schema: BaseSchema.extend({ a: z.string() }),
        derived: { nope: { from: ["a"], compute: () => 1 } } as any,
      }),
    ).toThrow(/derived field "nope"/)
    resetEntities()
    expect(() =>
      defineEntity("Engine", {
        schema: BaseSchema.extend({ a: z.string() }),
        derived: { a: { from: ["b" as any], compute: () => 1 } },
      }),
    ).toThrow(/reads "b"/)
    resetEntities()
    expect(() =>
      defineEntity("Engine", { schema: BaseSchema, readOnly: ["nope" as any] }),
    ).toThrow(/readOnly field "nope"/)
  })
})

describe("entity hooks", () => {
  const ctx = { container: { resolve: () => undefined } as any, module: "m", entity: "Engine" }

  it("run in registration order and compensate last-first with their own data", async () => {
    const calls: string[] = []
    onEntity("Engine", {
      created: {
        run: async ({ records }) => (calls.push(`a:${records.length}`), "A"),
        compensate: async (data) => void calls.push(`undo-a:${data}`),
      },
    })
    onEntity("Engine", {
      created: {
        run: async () => (calls.push("b"), "B"),
        compensate: async (data) => void calls.push(`undo-b:${data}`),
      },
    })
    const undo = await runHooks("created", ctx, { records: [{ id: "1" }] })
    await compensateHooks("created", ctx, undo)
    expect(calls).toEqual(["a:1", "b", "undo-b:B", "undo-a:A"])
  })

  it("undo the hooks that ran when a later one fails", async () => {
    const calls: string[] = []
    onEntity("Engine", {
      updated: { run: async () => (calls.push("a"), 1), compensate: async () => void calls.push("undo-a") },
    })
    onEntity("Engine", {
      updated: {
        run: async () => {
          throw new Error("boom")
        },
      },
    })
    await expect(runHooks("updated", ctx, { records: [], previous: [] })).rejects.toThrow("boom")
    expect(calls).toEqual(["a", "undo-a"])
  })

  it("deleting hooks can refuse a delete", async () => {
    onEntity("Engine", {
      deleting: async ({ ids }) => {
        if (ids.includes("used")) throw new Error("in use")
      },
    })
    await expect(runDeletingHooks(ctx, ["free"])).resolves.toBeUndefined()
    await expect(runDeletingHooks(ctx, ["used"])).rejects.toThrow("in use")
  })

  it("only run for their entity", async () => {
    const run = jest.fn(async () => undefined)
    onEntity("Other", { created: { run } })
    await runHooks("created", ctx, { records: [] })
    expect(run).not.toHaveBeenCalled()
  })
})
