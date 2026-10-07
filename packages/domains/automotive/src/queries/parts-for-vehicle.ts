import type { MedusaStoreRequest } from "@medusajs/framework/http";
import { localizedText } from "@repo/framework/core";
import { fitmentSearch, type BuildDate } from "./fitment-search";
import { storeProducts } from "./store-products";
import type { StorePartsParams } from "../api/store/validators";

/**
 * Products fitting a vehicle (optionally built at `build`), each variant with
 * its fitments; condition summaries in the request's locale (`?locale=`,
 * `x-medusa-locale`), else English.
 */
export async function partsForVehicle(
  req: MedusaStoreRequest<unknown>,
  vehicleId: string,
  params: StorePartsParams,
  build?: BuildDate,
) {
  const fitting = await fitmentSearch(req.scope as any).fittingVariants(vehicleId, build);
  const { limit, offset, ...filters } = params;
  return storeProducts(req, [...fitting.keys()], filters, { limit, offset }, (variantId) => ({
    fitments: (fitting.get(variantId) ?? []).map((f) => ({ ...f, conditions: localizedText(f.conditions, req.locale) })),
  }));
}
