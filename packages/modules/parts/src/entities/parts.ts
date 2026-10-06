import { z } from "@medusajs/framework/zod";
import { defineEntity, fields, type InferEntity } from "@repo/framework/entity";
import { BaseSchema } from "@repo/framework/utils";
import { ProductVariant } from "@repo/framework/medusa";

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum BrandKind {
  /** Sold in the shop: has a value in the shared "Brand" product option. */
  AFTERMARKET = "AFTERMARKET",
  /** Issues OE numbers (vehicle manufacturers, OE suppliers); not sold as a brand. */
  OE = "OE",
  BOTH = "BOTH",
}

export enum PartNumberType {
  /** The brand's own number for this variant. */
  MPN = "MPN",
  /** Original-equipment number (brand = the OE issuer). */
  OE = "OE",
  /** A competitor's number for the same part. */
  AFTERMARKET = "AFTERMARKET",
  /** A former number of this part (superseded). */
  PREVIOUS = "PREVIOUS",
}

/** Search key of a part number: "04465-02220" → "0446502220". */
export const normalizePartNumber = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const slug = z.string().slugify();

// ── Entities ──────────────────────────────────────────────────────────────────

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

export type Brand = InferEntity<typeof Brand>;
export type PartNumber = InferEntity<typeof PartNumber>;
export { ProductVariant };
