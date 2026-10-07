import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { PROVENANCE_FIELDS, provenanceFields, YearSchema, years, YEAR_CHECKS, YEAR_MESSAGES } from "./shared";

export const VehicleGeneration = defineEntity("VehicleGeneration", {
  schema: BaseSchema.extend({
    name: z.string().trim().min(1).describe("Generation name, e.g. Mk7, E90, XV70"),
    code: z.string().trim().nullable().describe("Manufacturer / catalog series code, e.g. 5G1"),
    year_start: YearSchema.describe("First production year"),
    year_end: YearSchema.nullable().describe("Last production year (empty: still produced)"),
    image: fields.image().describe("Generation image"),
    ...provenanceFields,
  }),
  relations: (r) => ({
    model: r.belongsTo("VehicleModel", { mappedBy: "generations" }),
    vehicles: r.hasMany("Vehicle", { mappedBy: "generation" }),
  }),
  readOnly: [...PROVENANCE_FIELDS],
  indexes: [{ name: "vehicle_generation_unique", on: ["model_id", "name"], unique: true }],
  checks: YEAR_CHECKS("vehicle_generation"),
  messages: {
    unique: [{ on: ["model_id", "name"], message: "This model already has a generation with this name." }],
    constraints: YEAR_MESSAGES("vehicle_generation"),
  },
  // "Volkswagen Golf Mk7 (5G1) 2012–2020"
  label: {
    fields: ["name", "code", "year_start", "year_end", "model.name", "model.make.name"],
    format: (g) =>
      [g.model?.make?.name, g.model?.name, g.name, g.code ? `(${g.code})` : "", years(g)]
        .filter(Boolean)
        .join(" "),
  },
});

export type VehicleGeneration = InferEntity<typeof VehicleGeneration>;
