import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { ProductVariant } from "@repo/framework/medusa";
import { BaseSchema } from "@repo/framework/utils";
import { Vehicle, YearSchema } from "@repo/module-vehicle/contract";

const MonthSchema = z.number().int().min(1).max(12);

export const Fitment = defineEntity("Fitment", {
  schema: BaseSchema.extend({
    quantity: z.number().int().min(1).default(1).describe("Units needed per vehicle"),
    from_year: YearSchema.nullable().describe("Fits from this production year (empty: the vehicle's)"),
    from_month: MonthSchema.nullable().describe("Fits from this month of from_year"),
    to_year: YearSchema.nullable().describe("Fits up to this production year (empty: the vehicle's)"),
    to_month: MonthSchema.nullable().describe("Fits up to this month of to_year"),
    notes: fields.translatable(z.string().nullable()).describe("Additional notes about the fitment (translatable)"),
    // Readable summary of the condition tree, kept by the conditions workflow.
    // One summary per locale: { en: "Drive is front-wheel drive", fr: "…" }.
    conditions_summary: fields.localized().describe("When the fitment applies"),
  }),
  readOnly: ["conditions_summary"],
  relations: (r) => ({
    // Ids stored on the fitment, resolved by read-only links (src/links/).
    variant: r.link("ProductVariant", { storage: "column" }),
    vehicle: r.link("Vehicle", { storage: "column" }),
    position: r.belongsTo("FitmentPosition", { mappedBy: "fitments", nullable: true }),
    conditionGroups: r.hasMany("FitmentConditionGroup", { mappedBy: "fitment" }),
  }),
  checks: [
    { name: "fitment_from_month_check", expression: "from_month IS NULL OR from_year IS NOT NULL" },
    { name: "fitment_to_month_check", expression: "to_month IS NULL OR to_year IS NOT NULL" },
    {
      name: "fitment_range_check",
      expression:
        "from_year IS NULL OR to_year IS NULL OR to_year * 100 + COALESCE(to_month, 12) >= from_year * 100 + COALESCE(from_month, 1)",
    },
  ],
  messages: {
    unique: [
      {
        on: ["variant_id", "vehicle_id", "position_id"],
        message: "This part is already fitted to this vehicle in this position.",
      },
    ],
  },
  // "Brake pad set (BP-123) → Toyota Corolla 2015–2020 · 1.6 I4 132 hp"
  label: {
    fields: [
      ...ProductVariant.label.fields.map((f) => `variant.${f}`),
      ...Vehicle.label.fields.map((f) => `vehicle.${f}`),
    ],
    format: (f, ctx) =>
      [f.variant && ProductVariant.label.format(f.variant, ctx), f.vehicle && Vehicle.label.format(f.vehicle, ctx)]
        .filter(Boolean)
        .join(" → "),
  },
});

export type Fitment = InferEntity<typeof Fitment>;
