import { z } from "@medusajs/framework/zod";
import { i18nKeys } from "@repo/framework/core";
import { defaultLabelContext, defineEntity, type InferEntity, type LabelContext } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { FuelType, FuelTypeSchema, EngineLayout, EngineLayoutSchema } from "./enums";
import { PROVENANCE_FIELDS, provenanceFields } from "./shared";

const LAYOUT_PREFIX: Record<EngineLayout, string> = {
  INLINE: "I",
  V: "V",
  BOXER: "H",
  W: "W",
  ROTARY: "R",
  ELECTRIC_MOTOR: "",
};

type EngineLabelRow = {
  displacement_cc?: number | null;
  fuel?: FuelType;
  layout?: EngineLayout | null;
  cylinders?: number | null;
  power_kw?: number;
  power_hp?: number;
  code?: string | null;
};

/**
 * "2.0 diesel I4 110 kW (150 hp) CJSA", "electric 150 kW (201 hp)"; `ctx`
 * translates the fuel and the hp unit (French: "gazole … (150 ch)").
 */
export const engineLabel = (e: EngineLabelRow, ctx: LabelContext = defaultLabelContext) =>
  [
    e.displacement_cc ? (e.displacement_cc / 1000).toFixed(1) : "",
    e.fuel ? ctx.value("VehicleEngine", "fuel", e.fuel).toLowerCase() : "",
    e.layout && e.layout !== EngineLayout.ELECTRIC_MOTOR ? `${LAYOUT_PREFIX[e.layout]}${e.cylinders ?? ""}` : "",
    e.power_kw != null
      ? `${e.power_kw} kW${e.power_hp != null ? ` (${e.power_hp} ${ctx.text(i18nKeys.message("vehicles", "units.hp"), "hp")})` : ""}`
      : "",
    e.code ?? "",
  ]
    .filter(Boolean)
    .join(" ");

export const VehicleEngine = defineEntity("VehicleEngine", {
  schema: BaseSchema.extend({
    code: z.string().trim().toUpperCase().nullable().describe("Manufacturer engine code, e.g. CJSA"),
    fuel: FuelTypeSchema.default(FuelType.GASOLINE).describe("Fuel / energy"),
    layout: EngineLayoutSchema.nullable().describe("Cylinder arrangement (electric motor for EVs)"),
    cylinders: z.number().int().min(1).max(16).nullable().describe("Number of cylinders"),
    displacement_cc: z.number().int().min(50).max(20000).nullable().describe("Displacement in cm³ (empty for EVs)"),
    power_kw: z.number().int().min(1).max(2000).describe("Power in kW"),
    power_hp: z.number().int().describe("Power in hp, derived from kW"),
    name: z.string().optional().describe("Technology, e.g. TDI, EcoBoost, turbo"),
    ...provenanceFields,
  }),
  relations: (r) => ({
    vehicles: r.hasMany("Vehicle", { mappedBy: "engine" }),
  }),
  derived: { power_hp: { from: ["power_kw"], compute: (e) => Math.round(e.power_kw * 1.34102) } },
  readOnly: [...PROVENANCE_FIELDS],
  // Unique on (fuel, layout, cylinders, displacement_cc, power_kw, code)
  // NULLS NOT DISTINCT: hand-written index (migration).
  messages: {
    unique: [
      {
        on: ["fuel", "layout", "cylinders", "displacement_cc", "power_kw", "code"],
        message: "An engine with these specifications already exists.",
      },
    ],
  },
  label: {
    fields: ["displacement_cc", "fuel", "layout", "cylinders", "power_kw", "power_hp", "code"],
    format: engineLabel,
  },
});

export type VehicleEngine = InferEntity<typeof VehicleEngine>;
