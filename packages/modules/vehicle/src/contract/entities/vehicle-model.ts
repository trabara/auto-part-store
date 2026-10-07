import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { VehicleCategory } from "./enums";
import { PROVENANCE_FIELDS, provenanceFields } from "./shared";

export const VehicleModel = defineEntity("VehicleModel", {
  schema: BaseSchema.extend({
    name: z.string().describe("The name of the vehicle model, e.g., Camry, F-150, etc."),
    slug: z.string().slugify().nullable().describe(""),
    image: fields.image().describe("Model image"),
    category: z.enum(VehicleCategory).default(VehicleCategory.CAR).describe("Car, light commercial, truck or motorcycle"),
    on_sale_new: z.boolean().default(false).describe("Sold new in the market (research goes there first)"),
    ...provenanceFields,
  }),
  relations: (r) => ({
    make: r.belongsTo("VehicleMake", { mappedBy: "models" }),
    generations: r.hasMany("VehicleGeneration", { mappedBy: "model" }),
  }),
  readOnly: [...PROVENANCE_FIELDS],
  // Unique on (make_id, lower(name)): model names repeat across makes (Ford /
  // GMC Sierra). Hand-written index (migration 20261006…).
  // Medusa's error parser reports only `name` for that expression index.
  messages: {
    unique: [{ on: ["name"], message: "This make already has a model with this name." }],
  },
});

/** A model's generation / series: "Golf Mk7 (5G1)", "3 Series E90". */

export type VehicleModel = InferEntity<typeof VehicleModel>;
