import type { Context } from "@medusajs/framework/types";
import { InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils";
import { normalizePartNumber } from "../contract";
import { partsModels } from "./models/parts";

/** A part number that matched a search. */
export type PartNumberMatch = { type: string; number: string; brand: string | null };

export type PartNumberSearch = {
  /** The normalized search key (empty when the query has no usable characters). */
  normalized: string;
  /** Matched variants, with the numbers that matched. */
  matches: Map<string, PartNumberMatch[]>;
  /** Variants interchangeable with a match (not matched themselves) → the match. */
  equivalentOf: Map<string, string>;
};

export default class PartsModuleService extends MedusaService(partsModels) {
  /**
   * Variants interchangeable with `variantId`: those sharing one of its part
   * numbers (same brand and normalized number: an OE number they both list,
   * or a competitor number that is another variant's MPN).
   */
  @InjectManager()
  async equivalentVariantIds(variantId: string, @MedusaContext() ctx: Context = {}): Promise<string[]> {
    const own = await this.listPartNumbers(
      { variant_id: variantId },
      { select: ["brand_id", "number_normalized"] },
      ctx,
    );
    if (!own.length) return [];
    const matches = await this.listPartNumbers(
      {
        $or: own.map((n) => ({ brand_id: n.brand_id, number_normalized: n.number_normalized })),
      } as any,
      { select: ["variant_id"] },
      ctx,
    );
    return [...new Set(matches.map((m) => m.variant_id))].filter((id) => id !== variantId);
  }

  /** Variants with a number (MPN, OE, competitor, former) matching `query`, and their equivalents. */
  @InjectManager()
  async findByNumber(query: string, @MedusaContext() ctx: Context = {}): Promise<PartNumberSearch> {
    const normalized = normalizePartNumber(query);
    const matches = new Map<string, PartNumberMatch[]>();
    const equivalentOf = new Map<string, string>();
    if (!normalized) return { normalized, matches, equivalentOf };

    const numbers = await this.listPartNumbers({ number_normalized: normalized }, { relations: ["brand"] }, ctx);
    for (const n of numbers) {
      matches.set(n.variant_id, [
        ...(matches.get(n.variant_id) ?? []),
        { type: n.type, number: n.number, brand: n.brand?.name ?? null },
      ]);
    }
    for (const variantId of matches.keys()) {
      for (const other of await this.equivalentVariantIds(variantId, ctx)) {
        if (!matches.has(other) && !equivalentOf.has(other)) equivalentOf.set(other, variantId);
      }
    }
    return { normalized, matches, equivalentOf };
  }
}
