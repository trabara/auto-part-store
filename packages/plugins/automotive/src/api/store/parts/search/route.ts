// Find parts by any number (MPN, OE, competitor, former), with equivalents.
import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { PARTS_MODULE, type PartsModuleService } from "../../../../modules/parts";
import { storeProducts } from "../../../../queries/store-products";
import type { StorePartSearchParams } from "../../validators";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { q, limit, offset, ...filters } = req.validatedQuery as StorePartSearchParams;
  const { normalized, matches, equivalentOf } = await req.scope.resolve<PartsModuleService>(PARTS_MODULE).findByNumber(q);
  const result = await storeProducts(
    req,
    [...matches.keys(), ...equivalentOf.keys()],
    filters,
    { limit, offset },
    (variantId) => ({
      matches: matches.get(variantId) ?? [],
      equivalent_of: equivalentOf.get(variantId) ?? null,
    }),
  );
  res.json({ query: q, normalized, ...result });
}
