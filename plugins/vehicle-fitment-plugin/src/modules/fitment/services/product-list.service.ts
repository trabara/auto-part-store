import { QueryContext } from "@medusajs/framework/utils";
import FitmentProductLink from "../../../links/fitment-product";
import { ProductOptionValueFilter } from "../schema";

export type ProductListInput = {
  region_id: string;
  currency_code: string;
  fitment_id?: string;
  category_id?: string;
  sort?: string;
  min_price?: number;
  max_price?: number;
  option_values?: ProductOptionValueFilter[];
  queryConfig: {
    fields?: string[];
    pagination?: { skip?: number; take?: number };
    [key: string]: any;
  };
};

export type ProductPriceRange = {
  min: number;
  max: number;
};

export type ProductOptionMeta = {
  title: string;
  option_id: string;
  values: string[];
};

export type ProductListResult = {
  products: any[];
  metadata: { count: number; [key: string]: any };
  price_range: ProductPriceRange;
  options: ProductOptionMeta[];
};

/**
 * ProductListService
 *
 * Encapsulates all product listing logic:
 * - Resolving fitment → product ID filter via links
 * - Computing absolute price_range and available options from the full unfiltered set
 * - Main product query (DB-level pagination for simple cases)
 * - JS post-processing: option-value filtering, price-range filtering, price sorting
 * - Manual pagination for post-processed results
 *
 * This is a plain service (not a MedusaService) — it has no data models of its
 * own and is intended to be instantiated directly by controllers, not registered
 * in the IoC container.
 */
export class ProductListService {
  private query: any;

  constructor(query: any) {
    this.query = query;
  }

  async list(input: ProductListInput): Promise<ProductListResult> {
    
    const {
      region_id,
      currency_code,
      fitment_id,
      category_id,
      sort,
      min_price,
      max_price,
      option_values,
      queryConfig,
    } = input;

    // ── Build base filters (category + fitment, no price/option constraints) ──
    let baseFilters: Record<string, any> = {};

    if (category_id) {
      baseFilters.categories = { id: category_id };
    }

    if (fitment_id) {
      const { data: links } = await this.query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["product_id"],
        filters: { fitment_id },
      });

      if (links.length === 0) {
        return {
          products: [],
          metadata: { count: 0 },
          price_range: { min: 0, max: 0 },
          options: [],
        };
      }

      baseFilters.id = links.map(
        ({ product_id }: { product_id: string }) => product_id,
      );
    }

    // ── Absolute metadata query ──────────────────────────────────────────────
    // Fetch all products matching base filters to derive price_range + options.
    // This query is intentionally lightweight (minimal fields).
    const { data: allProducts } = await this.query.graph({
      entity: "product",
      fields: [
        "id",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
        "variants.id",
        "variants.calculated_price.calculated_amount",
      ],
      filters: baseFilters,
      pagination: { skip: 0, take: 10000 },
      context: {
        variants: {
          calculated_price: QueryContext({ region_id, currency_code }),
        },
      },
    });

    const price_range = this.computePriceRange(allProducts);
    const options = this.computeOptions(allProducts);

    // ── Determine whether JS post-processing is required ────────────────────
    const hasPriceFilter = min_price !== undefined || max_price !== undefined;
    const hasPriceSort = sort === "price_asc" || sort === "price_desc";
    const hasOptionFilter = !!option_values && option_values.length > 0;
    const needsPostProcessing =
      hasPriceFilter || hasPriceSort || hasOptionFilter;

    // ── Main product query ───────────────────────────────────────────────────
    // When post-processing is needed we fetch everything then paginate in JS;
    // otherwise we let the DB handle pagination directly.
    const effectiveQueryConfig = needsPostProcessing
      ? {
          ...queryConfig,
          pagination: { ...queryConfig.pagination, skip: 0, take: 10000 },
        }
      : queryConfig;

    const { data, metadata } = await this.query.graph({
      entity: "product",
      ...effectiveQueryConfig,
      filters: baseFilters,
      context: {
        variants: {
          calculated_price: QueryContext({ region_id, currency_code }),
        },
      },
    });

    if (!needsPostProcessing) {
      return { products: data, metadata, price_range, options };
    }

    // ── JS post-processing ───────────────────────────────────────────────────
    let processed: any[] = [...data];

    if (hasOptionFilter) {
      processed = this.filterByOptions(processed, option_values!, options);
    }

    if (hasPriceFilter) {
      processed = this.filterByPrice(processed, min_price, max_price);
    }

    if (hasPriceSort) {
      processed = this.sortByPrice(processed, sort!);
    }

    // Manual pagination over the post-processed set
    const { skip = 0, take = 12 } = queryConfig.pagination ?? {};
    const paginatedProducts = processed.slice(skip, skip + take);

    return {
      products: paginatedProducts,
      metadata: { count: processed.length },
      price_range,
      options,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private computePriceRange(products: any[]): ProductPriceRange {
    let absMin = Infinity;
    let absMax = -Infinity;

    for (const product of products) {
      for (const variant of product.variants ?? []) {
        const amount = variant.calculated_price?.calculated_amount;
        if (amount == null) continue;
        if (amount < absMin) absMin = amount;
        if (amount > absMax) absMax = amount;
      }
    }

    return absMin === Infinity
      ? { min: 0, max: 0 }
      : { min: absMin, max: absMax };
  }

  private computeOptions(products: any[]): ProductOptionMeta[] {
    // Map: option title → { title, option_id (first seen), distinct values }
    const optionsMap = new Map<
      string,
      { title: string; option_id: string; values: Set<string> }
    >();

    for (const product of products) {
      for (const opt of product.options ?? []) {
        if (!opt?.title || !opt?.id) continue;

        if (!optionsMap.has(opt.title)) {
          optionsMap.set(opt.title, {
            title: opt.title,
            option_id: opt.id,
            values: new Set(),
          });
        }

        const entry = optionsMap.get(opt.title)!;
        for (const ov of opt.values ?? []) {
          if (ov?.value) entry.values.add(ov.value);
        }
      }
    }

    return Array.from(optionsMap.values()).map((o) => ({
      title: o.title,
      option_id: o.option_id,
      values: Array.from(o.values),
    }));
  }

  /**
   * Filter products by option values using product.options[title].values[].value.
   *
   * query.graph nested variant-option filters are unreliable in Medusa v2 because
   * each product has its own option_id per title. We resolve option_id → title via
   * the absolute metadata and filter against product-level option values instead.
   *
   * Logic: values within the same option title are OR; multiple titles are AND.
   */
  private filterByOptions(
    products: any[],
    requestedValues: ProductOptionValueFilter[],
    absoluteOptions: ProductOptionMeta[],
  ): any[] {
    // Build option_id → title lookup from absolute metadata
    const titleById = new Map<string, string>(
      absoluteOptions.map((o) => [o.option_id, o.title]),
    );

    // Group requested filters by option title
    const grouped = new Map<string, Set<string>>();
    for (const { option_id, value } of requestedValues) {
      const title = titleById.get(option_id) ?? option_id;
      if (!grouped.has(title)) grouped.set(title, new Set());
      grouped.get(title)!.add(value);
    }

    return products.filter((product) =>
      // All option groups must be satisfied (AND)
      Array.from(grouped.entries()).every(([title, allowedValues]) => {
        const productOpt = (product.options ?? []).find(
          (o: any) => o?.title === title,
        );
        if (!productOpt) return false;
        // At least one product option value must be in the allowed set (OR)
        return (productOpt.values ?? []).some(
          (ov: any) => ov?.value && allowedValues.has(ov.value),
        );
      }),
    );
  }

  private filterByPrice(products: any[], min?: number, max?: number): any[] {
    return products.filter((product) =>
      (product.variants ?? []).some((variant: any) => {
        const amount = variant.calculated_price?.calculated_amount;
        if (amount == null) return false;
        if (min !== undefined && amount < min) return false;
        if (max !== undefined && amount > max) return false;
        return true;
      }),
    );
  }

  private sortByPrice(products: any[], sort: string): any[] {
    const minPriceOf = (product: any): number => {
      if (!product.variants?.length) return Infinity;
      return Math.min(
        ...product.variants.map(
          (v: any) => v.calculated_price?.calculated_amount ?? Infinity,
        ),
      );
    };

    return [...products].sort((a, b) => {
      const diff = minPriceOf(a) - minPriceOf(b);
      return sort === "price_asc" ? diff : -diff;
    });
  }
}
