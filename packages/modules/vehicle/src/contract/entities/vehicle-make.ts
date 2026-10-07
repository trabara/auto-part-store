import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { PROVENANCE_FIELDS, provenanceFields } from "./shared";

export const VehicleMake = defineEntity("VehicleMake", {
  schema: BaseSchema.extend({
    name: z.string().describe("The name of the vehicle make, e.g., Toyota, Ford, etc."),
    slug: z.string().slugify().nullable().describe(""),
    logo: fields.image().describe("Brand logo"),
    ...provenanceFields,
  }),
  relations: (r) => ({
    models: r.hasMany("VehicleModel", { mappedBy: "make" }),
  }),
  readOnly: [...PROVENANCE_FIELDS],
  // Unique on lower(name): hand-written index (migration 20261006…), DML
  // indexes can't hold expressions.
});

export type VehicleMake = InferEntity<typeof VehicleMake>;
