import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { BrandKind } from "./enums";

const slug = z.string().slugify();

export const Brand = defineEntity("Brand", {
  schema: BaseSchema.extend({
    name: z.string().trim().min(1).describe("Brand name, e.g. Bosch, Brembo, Toyota"),
    slug: z.string().describe("URL key, derived from the name"),
    logo: fields.image().describe("Brand logo"),
    kind: z.enum(BrandKind).default(BrandKind.AFTERMARKET).describe("Sold brand, OE issuer, or both"),
    // Value of the shared "Brand" product option (set by the parts module's
    // hooks for sold brands; variants pick it as their brand).
    option_value_id: z.string().nullable(),
  }),
  relations: (r) => ({
    partNumbers: r.hasMany("PartNumber", { mappedBy: "brand" }),
  }),
  derived: { slug: { from: ["name"], compute: (b) => slug.parse(b.name) } },
  readOnly: ["option_value_id"],
  indexes: [{ name: "brand_option_value_id", on: ["option_value_id"] }],
  // Unique on lower(name): hand-written index (migration).
  messages: { unique: [{ on: ["name"], message: "A brand with this name already exists." }] },
});

export type Brand = InferEntity<typeof Brand>;
