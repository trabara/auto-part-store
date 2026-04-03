import { z } from "@medusajs/framework/zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

const BaseFindParams = createFindParams();

export const ProductOptionValueFilterSchema = z.object({
  option_id: z.string(),
  value: z.string(),
});

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

export const ProductSearchParams = BaseFindParams.extend({
  q: z.string().min(1),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});

export const ProductRelatedFindParams = BaseFindParams.extend({
  product_id: z.string(),
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
});
