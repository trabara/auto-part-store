import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";

export const FitmentPosition = defineEntity("FitmentPosition", {
  schema: BaseSchema.extend({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .describe("The code of the fitment position, e.g., 'FRONT_LEFT', 'REAR_RIGHT', etc."),
    // Shown in the storefront: translated per locale (Medusa's Translation module).
    name: fields.translatable().describe("The name of the fitment position, e.g., 'Front Left', 'Rear Right', etc."),
    category: fields
      .translatable(z.string().nullable())
      .describe("The category of the fitment position, e.g., 'Front', 'Rear', etc."),
  }),
  relations: (r) => ({
    fitments: r.hasMany("Fitment", { mappedBy: "position" }),
  }),
  indexes: [{ name: "fitment_position_code_unique", on: ["code"], unique: true }],
});

/**
 * An application: this part (variant) fits this vehicle, optionally in a
 * position, a quantity per vehicle and a narrower production window, subject
 * to its condition groups. Unique per (variant, vehicle, position), including
 * a missing position (hand-written NULLS NOT DISTINCT index).
 */

export type FitmentPosition = InferEntity<typeof FitmentPosition>;
