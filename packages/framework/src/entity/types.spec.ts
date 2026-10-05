/**
 * Type-level tests for entity inference through the registry (P1.0 spike).
 * The assertions are checked by `tsc` (check-types); jest only runs the file.
 */
import type { InferEntityType } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { BaseSchema } from "../utils/validation"
import { defineEntities, defineEntity } from "./index"

type Assert<T extends true> = T
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type IsAny<T> = 0 extends 1 & T ? true : false

// ── Entities: mutual (Vehicle ↔ Engine) and self relations (Group) ──────────

const Vehicle = defineEntity("TVehicle", {
  schema: BaseSchema.extend({
    year_start: z.number(),
    year_end: z.number().nullable(),
  }),
  relations: (r) => ({
    engine: r.belongsTo("TEngine", { mappedBy: "vehicles" }),
  }),
  checks: [{ name: "years", expression: "year_end IS NULL OR year_end >= year_start" }],
})

const Engine = defineEntity("TEngine", {
  schema: BaseSchema.extend({
    power: z.number(),
    name: z.string().optional(),
  }),
  relations: (r) => ({
    vehicles: r.hasMany("TVehicle", { mappedBy: "engine" }),
  }),
})

const Group = defineEntity("TGroup", {
  schema: BaseSchema.extend({ operator: z.enum(["and", "or"]) }),
  relations: (r) => ({
    parent: r.belongsTo("TGroup", { mappedBy: "children", nullable: true }),
    children: r.hasMany("TGroup", { mappedBy: "parent" }),
  }),
})

declare module "./index" {
  interface EntityRegistry {
    TVehicle: typeof Vehicle
    TEngine: typeof Engine
    TGroup: typeof Group
  }
}

const automotive = defineEntities({ TVehicle: Vehicle, TEngine: Engine, TGroup: Group })

// ── Inferred entity types ───────────────────────────────────────────────────

type VehicleT = InferEntityType<typeof Vehicle.model>
type EngineT = InferEntityType<typeof Engine.model>
type GroupT = InferEntityType<typeof Group.model>

type _VehicleNotAny = Assert<IsAny<VehicleT> extends false ? true : false>
type _VehicleScalars = Assert<Equals<VehicleT["year_end"], number | null>>
type _VehicleFk = Assert<Equals<VehicleT["engine_id"], string>>
type _VehicleRelation = Assert<Equals<VehicleT["engine"]["power"], number>>
type _EngineHasMany = Assert<Equals<EngineT["vehicles"][number]["year_start"], number>>
type _EngineOptional = Assert<Equals<EngineT["name"], string | undefined>>
type _GroupSelf = Assert<Equals<GroupT["children"][number]["operator"], "and" | "or">>
type _GroupNullableFk = Assert<Equals<GroupT["parent_id"], string | null>>
type _ModelName = Assert<Equals<typeof Vehicle.modelName, "t_vehicle">>

// ── DTOs ────────────────────────────────────────────────────────────────────

type CreateVehicle = z.infer<typeof Vehicle.dto.create>
type _CreateHasFk = Assert<Equals<CreateVehicle["engine_id"], string>>
type _CreateNoId = Assert<"id" extends keyof CreateVehicle ? false : true>
type _CreateNoRelation = Assert<"engine" extends keyof CreateVehicle ? false : true>
type CreateGroup = z.infer<typeof Group.dto.create>
type _CreateNullableFk = Assert<Equals<CreateGroup["parent_id"], string | null | undefined>>
type UpdateVehicle = z.infer<typeof Vehicle.dto.update>
type _UpdatePartial = Assert<Equals<UpdateVehicle["year_start"], number | undefined>>

// ── Service ─────────────────────────────────────────────────────────────────

class Service extends MedusaService(automotive.models) {}
type Listed = Awaited<ReturnType<Service["listTVehicles"]>>[number]
type _ServiceTyped = Assert<Equals<Listed["engine_id"], string>>

// ── Registry rejects unknown targets ────────────────────────────────────────

void (() =>
  defineEntity("TBroken", {
    schema: BaseSchema,
    // @ts-expect-error — "Nope" is not a registered entity
    relations: (r) => ({ x: r.belongsTo("Nope") }),
  }))

describe("entity type inference", () => {
  it("compiles (assertions are type-level)", () => {
    expect(automotive.byKey("t_vehicle")).toBe(Vehicle)
  })
})
