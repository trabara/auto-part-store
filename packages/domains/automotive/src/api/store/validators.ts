import { z } from "@medusajs/framework/zod";
import { CustomerVehicle } from "@repo/module-garage/contract";

const ids = z.union([z.string(), z.array(z.string())]);
const year = z.coerce.number().int().min(1886).max(2100);

/** Product listing params shared by the parts endpoints. */
export const StorePartsParams = z.object({
  region_id: z.string().optional(),
  category_id: ids.optional(),
  brand_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const StoreVehiclePartsParams = StorePartsParams.extend({
  build_year: year.optional(),
  build_month: z.coerce.number().int().min(1).max(12).optional(),
});

export const StorePartSearchParams = StorePartsParams.extend({
  q: z.string().trim().min(2),
});

export const StoreSelectorParams = z.object({
  make_id: z.string().optional(),
  model_id: z.string().optional(),
  generation_id: z.string().optional(),
  year: year.optional(),
});

export type StorePartsParams = z.infer<typeof StorePartsParams>;
export type StoreVehiclePartsParams = z.infer<typeof StoreVehiclePartsParams>;
export type StorePartSearchParams = z.infer<typeof StorePartSearchParams>;
export type StoreSelectorParams = z.infer<typeof StoreSelectorParams>;

/** Garage payloads: the customer comes from the session, never the body. */
export const GarageCreateSchema = CustomerVehicle.dto.create.omit({ customer_id: true });
export const GarageUpdateSchema = CustomerVehicle.dto.update.omit({ customer_id: true });
