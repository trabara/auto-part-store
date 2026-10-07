import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { VehicleReferenceSource } from "./enums";

/** A vehicle's id in an external catalog (TecDoc KType, ACES VehicleID, …). */
export const VehicleReference = defineEntity("VehicleReference", {
  schema: BaseSchema.extend({
    source: z.enum(VehicleReferenceSource).describe("Catalog"),
    external_id: z.string().trim().min(1).describe("The vehicle's id in that catalog"),
  }),
  relations: (r) => ({
    vehicle: r.belongsTo("Vehicle", { mappedBy: "references" }),
  }),
  indexes: [{ name: "vehicle_reference_unique", on: ["source", "external_id"], unique: true }],
  messages: {
    unique: [{ on: ["source", "external_id"], message: "This catalog id already belongs to a vehicle." }],
  },
  label: { fields: ["source", "external_id"], format: (r) => `${r.source}: ${r.external_id}` },
});

export type VehicleReference = InferEntity<typeof VehicleReference>;
