import { MedusaService } from "@medusajs/framework/utils";
import { partsModels } from "./models/parts";

export default class PartsModuleService extends MedusaService(partsModels) {
  /**
   * Variants interchangeable with `variantId`: those sharing one of its part
   * numbers (same brand and normalized number: an OE number they both list,
   * or a competitor number that is another variant's MPN).
   */
  async equivalentVariantIds(variantId: string): Promise<string[]> {
    const own = await this.listPartNumbers(
      { variant_id: variantId },
      { select: ["brand_id", "number_normalized"] },
    );
    if (!own.length) return [];
    const matches = await this.listPartNumbers(
      {
        $or: own.map((n) => ({ brand_id: n.brand_id, number_normalized: n.number_normalized })),
      } as any,
      { select: ["variant_id"] },
    );
    return [...new Set(matches.map((m) => m.variant_id))].filter((id) => id !== variantId);
  }
}
