import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { YearSchema } from "@repo/module-vehicle/contract";

/** A vehicle a customer owns ("my vehicles"): the storefront filters parts by it. */
export const CustomerVehicle = defineEntity("CustomerVehicle", {
  schema: BaseSchema.extend({
    nickname: z.string().trim().nullable().describe("Customer's name for it, e.g. Work van"),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "A VIN has 17 letters and digits (no I, O or Q)")
      .nullable()
      .describe("Vehicle identification number"),
    registration: z.string().trim().toUpperCase().nullable().describe("Registration plate"),
    is_default: z.boolean().default(false).describe("The customer's default vehicle"),
    // Narrows fitments with a production window ("from 03/2018").
    build_year: YearSchema.nullable().optional().describe("Build year, if known"),
    build_month: z.number().int().min(1).max(12).nullable().optional().describe("Build month, if known"),
  }),
  relations: (r) => ({
    customer: r.link("Customer", { storage: "column" }),
    // The vehicle module owns the catalog: a column link (read through the
    // domain's defineLink), not a foreign key.
    vehicle: r.link("Vehicle", { storage: "column" }),
  }),
  checks: [{ name: "customer_vehicle_build_month_check", expression: "build_month IS NULL OR build_year IS NOT NULL" }],
  messages: { constraints: { customer_vehicle_build_month_check: "A build month needs a build year." } },
  label: {
    fields: ["nickname", "registration"],
    format: (c) => [c.nickname, c.registration].filter(Boolean).join(" · "),
  },
});

export type CustomerVehicle = InferEntity<typeof CustomerVehicle>;
