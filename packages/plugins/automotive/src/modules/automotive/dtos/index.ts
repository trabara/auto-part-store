import * as z from "@medusajs/framework/zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

// Entity create/update/filter DTOs are derived by `defineEntity`
// (see ../entities). Only payloads not tied to a single entity live here.

// ── Link schemas ──────────────────────────────────────────────────────────────

export const LinkProductsInputSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, "At least one product ID is required"),
});
export type LinkProductsInput = z.infer<typeof LinkProductsInputSchema>;

export const LinkFitmentsInputSchema = z.object({
  fitment_ids: z
    .array(z.string())
    .min(1, "At least one fitment ID is required"),
});
export type LinkFitmentsInput = z.infer<typeof LinkFitmentsInputSchema>;

// ── Product search params ─────────────────────────────────────────────────────

const BaseFindParams = createFindParams();

export const ProductOptionValueFilterSchema = z.object({
  option_id: z.string(),
  value: z.string(),
});

export type ProductOptionValueFilter = z.infer<
  typeof ProductOptionValueFilterSchema
>;

export const ProductV2FindParams = BaseFindParams.extend({
  currency_code: z.string(),
  region_id: z.string(),
  q: z.string().optional(),
  fitment_id: z.string().optional(),
  category_id: z.string().optional(),
  sort: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  status: z
    .union([
      z.enum(["in_stock", "on_sale"]),
      z.array(z.enum(["in_stock", "on_sale"])),
    ])
    .optional(),
  option_values: z
    .union([
      z.array(ProductOptionValueFilterSchema),
      ProductOptionValueFilterSchema.transform((v) => [v]),
    ])
    .optional(),
});

export type ProductV2FindParams = z.infer<typeof ProductV2FindParams>;

export const ProductSearchParams = BaseFindParams.extend({
  q: z.string().min(1),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});

export type ProductSearchParams = z.infer<typeof ProductSearchParams>;

export const ProductRelatedFindParams = BaseFindParams.extend({
  product_id: z.string(),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});
export type ProductRelatedFindParams = z.infer<typeof ProductRelatedFindParams>;
