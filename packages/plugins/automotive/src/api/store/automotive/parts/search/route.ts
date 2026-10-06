// Find parts by any number (MPN, OE, competitor, former), with equivalents.
import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { storeProducts } from "../../../../../lib/store-products";
import { PARTS_MODULE, type PartsModuleService } from "../../../../../modules/parts";
import { normalizePartNumber } from "../../../../../modules/parts/entities";
import type { StorePartSearchParams } from "../../validators";

type Match = { type: string; number: string; brand: string | null };

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { q, limit, offset, ...filters } = req.validatedQuery as StorePartSearchParams;
  const parts = req.scope.resolve<PartsModuleService>(PARTS_MODULE);
  const key = normalizePartNumber(q);

  const numbers = key
    ? await parts.listPartNumbers({ number_normalized: key }, { relations: ["brand"] })
    : [];
  const matches = new Map<string, Match[]>();
  for (const n of numbers) {
    matches.set(n.variant_id, [
      ...(matches.get(n.variant_id) ?? []),
      { type: n.type, number: n.number, brand: (n as any).brand?.name ?? null },
    ]);
  }
  // Equivalents: variants sharing a number with a match (not matched themselves).
  const equivalentOf = new Map<string, string>();
  for (const variantId of matches.keys()) {
    for (const other of await parts.equivalentVariantIds(variantId)) {
      if (!matches.has(other) && !equivalentOf.has(other)) equivalentOf.set(other, variantId);
    }
  }

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
  res.json({ query: q, normalized: key, ...result });
}
