import { z } from "@medusajs/framework/zod";
import { defineEntity, type InferEntity } from "@repo/framework/entity";
import { ProductVariant } from "@repo/framework/medusa";
import { BaseSchema } from "@repo/framework/utils";
import { PartNumberType } from "./enums";

/** Search key of a part number: "04465-02220" → "0446502220". */
export const normalizePartNumber = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const PartNumber = defineEntity("PartNumber", {
  schema: BaseSchema.extend({
    type: z.enum(PartNumberType).describe("Whose number this is for the part"),
    number: z.string().trim().min(1).describe("The number as printed, e.g. 04465-02220"),
    number_normalized: z.string().describe("Search key: uppercase, letters and digits only"),
  }),
  relations: (r) => ({
    variant: r.link("ProductVariant", { storage: "column" }),
    brand: r.belongsTo("Brand", { mappedBy: "partNumbers" }),
  }),
  derived: {
    number_normalized: { from: ["number"], compute: (p) => normalizePartNumber(p.number) },
  },
  indexes: [
    {
      name: "part_number_unique",
      on: ["variant_id", "type", "brand_id", "number_normalized"],
      unique: true,
    },
    { name: "part_number_lookup", on: ["number_normalized"] },
    { name: "part_number_brand_lookup", on: ["brand_id", "number_normalized"] },
  ],
  messages: {
    unique: [
      {
        on: ["variant_id", "type", "brand_id", "number_normalized"],
        message: "This number is already listed for this part.",
      },
    ],
  },
  // "Bosch 0 986 494 123"
  label: {
    fields: ["number", "brand.name"],
    format: (p) => [p.brand?.name, p.number].filter(Boolean).join(" "),
  },
});

export type PartNumber = InferEntity<typeof PartNumber>;
export { ProductVariant };
