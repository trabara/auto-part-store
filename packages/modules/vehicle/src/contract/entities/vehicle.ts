import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { Drive, DriveSchema, Transmission, TransmissionSchema, BodyStyle, BodyStyleSchema } from "./enums";
import { YearSchema, years, YEAR_CHECKS, YEAR_MESSAGES } from "./shared";
import { engineLabel } from "./vehicle-engine";

/**
 * One configuration of a generation: engine, body, drive, transmission, trim
 * and production years. Configurations with the same specifications can't
 * overlap in years (exclusion constraint, migration), and must fall within
 * their generation's years (hook).
 */
export const Vehicle = defineEntity("Vehicle", {
  schema: BaseSchema.extend({
    body_style: BodyStyleSchema.default(BodyStyle.SEDAN).describe("Body style"),
    doors: z.number().int().min(2).max(6).default(4).describe("Number of doors"),
    drive: DriveSchema.default(Drive.FWD).describe("Drive system"),
    transmission: TransmissionSchema.default(Transmission.MANUAL).describe("Transmission"),
    trim: z.string().trim().nullable().describe("Trim / submodel, e.g. Highline, GTI"),
    year_start: YearSchema.describe("First production year"),
    year_end: YearSchema.nullable().describe("Last production year (empty: still produced)"),
  }),
  relations: (r) => ({
    generation: r.belongsTo("VehicleGeneration", { mappedBy: "vehicles" }),
    engine: r.belongsTo("VehicleEngine", { mappedBy: "vehicles" }),
    references: r.hasMany("VehicleReference", { mappedBy: "vehicle" }),
  }),
  checks: YEAR_CHECKS("vehicle"),
  messages: {
    constraints: {
      ...YEAR_MESSAGES("vehicle"),
      vehicle_configuration_overlap:
        "A vehicle with the same generation, engine and specifications already covers some of these years.",
    },
  },
  // "Volkswagen Golf Mk7 Highline 2015–2020 · 2.0 diesel I4 110 kW (150 hp)"
  label: {
    fields: [
      "trim",
      "year_start",
      "year_end",
      "generation.name",
      "generation.model.name",
      "generation.model.make.name",
      ...["displacement_cc", "fuel", "layout", "cylinders", "power_kw", "power_hp", "code"].map((f) => `engine.${f}`),
    ],
    format: (v, ctx) => {
      const g = v.generation;
      const name = [g?.model?.make?.name, g?.model?.name, g?.name, v.trim].filter(Boolean).join(" ");
      const engine = v.engine ? engineLabel(v.engine, ctx) : "";
      return name ? [`${name} ${years(v)}`.trim(), engine].filter(Boolean).join(" · ") : "";
    },
  },
});

export type Vehicle = InferEntity<typeof Vehicle>;
