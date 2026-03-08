import FitmentProductLink from "../../../links/fitment-product";
import { FITMENT_MODULE } from "..";
import {
  ContainerRegistrationKeys,
  Modules,
  QueryContext,
} from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { ProductOptionValueFilter } from "../schema";

/**
 * Product Controller
 *
 * Handles the linking/unlinking of products and fitments.
 * Following SRP: Single responsibility is managing product-fitment relationships.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class ProductController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      const {
        region_id,
        currency_code,
        fitment_id,
        category_id,
        sort,
        min_price,
        max_price,
        option_values,
      } = this.req.filterableFields as {
        region_id: string;
        currency_code: string;
        fitment_id?: string;
        category_id?: string;
        sort?: string;
        min_price?: number;
        max_price?: number;
        option_values?: ProductOptionValueFilter[];
      };

      this.logger.info("Listing products with filters", {
        filters: this.req.filterableFields,
        queryConfig: this.req.queryConfig,
      });

      // Build base filters (category + fitment only, no price/option filters).
      // These are used both for the main query and the "absolute" metadata query.
      let baseFilters: Record<string, any> = {};

      if (category_id) {
        baseFilters = {
          ...baseFilters,
          categories: { id: category_id },
        };
      }

      if (fitment_id) {
        const { data: links } = await query.graph({
          entity: FitmentProductLink.entryPoint,
          fields: ["product_id"],
          filters: { fitment_id },
        });

        if (links.length === 0) {
          this.logger.info(`No products found for fitment ${fitment_id}`);
          this.success({
            products: [],
            metadata: { count: 0 },
            price_range: { min: 0, max: 0 },
            options: [],
          });
          return;
        }

        baseFilters = {
          ...baseFilters,
          id: links.map(({ product_id }) => product_id),
        };
      }

      // ── Absolute metadata query ──────────────────────────────────────────
      // Fetch all products matching base filters (no price/option constraints)
      // to derive absolute price_range and available options.
      const { data: allProducts } = await query.graph({
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

      // Compute absolute price range across all matching products
      let absMin = Infinity;
      let absMax = -Infinity;
      for (const product of allProducts as any[]) {
        for (const variant of product.variants ?? []) {
          const amount = variant.calculated_price?.calculated_amount;
          if (amount == null) continue;
          if (amount < absMin) absMin = amount;
          if (amount > absMax) absMax = amount;
        }
      }
      const price_range =
        absMin === Infinity ? { min: 0, max: 0 } : { min: absMin, max: absMax };

      // Compute available options (title → distinct values with option_id)
      const optionsMap = new Map<
        string,
        { title: string; option_id: string; values: Set<string> }
      >();
      for (const product of allProducts as any[]) {
        for (const opt of product.options ?? []) {
          if (!opt?.title || !opt?.id) continue;
          if (!optionsMap.has(opt.title)) {
            optionsMap.set(opt.title, {
              title: opt.title,
              option_id: opt.id,
              values: new Set(),
            });
          }
          for (const ov of opt.values ?? []) {
            if (ov?.value) optionsMap.get(opt.title)!.values.add(ov.value);
          }
        }
      }
      const options = Array.from(optionsMap.values()).map((o) => ({
        title: o.title,
        option_id: o.option_id,
        values: Array.from(o.values),
      }));

      // ── Build filterable fields for the main query ───────────────────────
      let filtersFields: Record<string, any> = { ...baseFilters };

      // Option value filters
      if (option_values && option_values.length > 0) {
        const grouped = option_values.reduce(
          (acc: Record<string, string[]>, { option_id, value }) => {
            if (!acc[option_id]) acc[option_id] = [];
            acc[option_id].push(value);
            return acc;
          },
          {},
        );

        const optionGroups = Object.entries(grouped) as [string, string[]][];
        if (optionGroups.length === 1) {
          const [option_id, values] = optionGroups[0];
          filtersFields.$or = values.map((value) => ({
            variants: { options: { value, option_id } },
          }));
        } else if (optionGroups.length > 1) {
          filtersFields.$and = optionGroups.map(([option_id, values]) => ({
            $or: values.map((value) => ({
              variants: { options: { value, option_id } },
            })),
          }));
        }
      }

      // ── Main product query ───────────────────────────────────────────────
      const hasPriceFilter = min_price !== undefined || max_price !== undefined;
      const hasPriceSort = sort === "price_asc" || sort === "price_desc";

      const queryConfig =
        hasPriceFilter || hasPriceSort
          ? {
              ...this.req.queryConfig,
              pagination: {
                ...this.req.queryConfig.pagination,
                skip: 0,
                take: 10000,
              },
            }
          : this.req.queryConfig;

      const { data, metadata } = await query.graph({
        entity: "product",
        ...queryConfig,
        filters: filtersFields,
        context: {
          variants: {
            calculated_price: QueryContext({ region_id, currency_code }),
          },
        },
      });

      this.logger.info(`Retrieved ${data.length} products`, {
        count: data.length,
      });

      if (!hasPriceFilter && !hasPriceSort) {
        this.success({ products: data, metadata, price_range, options });
        return;
      }

      // Helper: get cheapest calculated_amount for a product
      const minPriceOf = (product: any): number => {
        if (!product.variants?.length) return Infinity;
        return Math.min(
          ...product.variants.map(
            (v: any) => v.calculated_price?.calculated_amount ?? Infinity,
          ),
        );
      };

      // Post-filter by calculated price range
      let processed: any[] = hasPriceFilter
        ? data.filter((product: any) => {
            return product.variants?.some((variant: any) => {
              const amount = variant.calculated_price?.calculated_amount;
              if (amount == null) return false;
              if (min_price !== undefined && amount < min_price) return false;
              if (max_price !== undefined && amount > max_price) return false;
              return true;
            });
          })
        : [...data];

      // Post-sort by price if requested
      if (hasPriceSort) {
        processed.sort((a: any, b: any) => {
          const diff = minPriceOf(a) - minPriceOf(b);
          return sort === "price_asc" ? diff : -diff;
        });
      }

      // Apply pagination from the original request on the processed set
      const { skip = 0, take = 12 } = this.req.queryConfig.pagination ?? {};
      const paginatedProducts = processed.slice(skip, skip + take);

      this.logger.info(
        `After post-processing: ${processed.length} products, returning ${paginatedProducts.length}`,
      );

      this.success({
        products: paginatedProducts,
        metadata: { count: processed.length },
        price_range,
        options,
      });
    }, "Products retrieved successfully");
  }

  /**
   * GET /admin/products/:id/fitments
   * Get all fitments linked to a product
   */
  async getFitmentsForProduct(): Promise<void> {
    await this.execute(async () => {
      const { id: productId } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching fitments for product: ${productId}`);

      // Query product with its linked fitments
      const { data: products } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "fitments.id",
          "fitments.body_style",
          "fitments.doors",
          "fitments.drive",
          "fitments.transmission",
          "fitments.year_start",
          "fitments.year_end",
          "fitments.model.id",
          "fitments.model.name",
          "fitments.model.make.id",
          "fitments.model.make.name",
          "fitments.engine.id",
          "fitments.engine.fuel",
          "fitments.engine.type",
          "fitments.engine.size",
          "fitments.engine.tech",
        ],
        filters: {
          id: productId,
        },
      });

      const fitments =
        products && products[0] ? products[0].fitments || [] : [];

      this.logger.info(
        `Found ${fitments.length} fitments for product ${productId}`,
      );

      this.success({ fitments });
    }, `Fitments retrieved for product ${this.req.params.id}`);
  }

  /**
   * POST /admin/products/:id/fitments
   * Link multiple fitments to a product
   */
  async linkFitmentsToProduct(): Promise<void> {
    await this.execute(async () => {
      const { id: productId } = this.req.params;
      const { fitment_ids } = this.req.validatedBody as {
        fitment_ids: string[];
      };

      this.logger.info(
        `Linking ${fitment_ids.length} fitments to product ${productId}`,
      );

      const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);

      // Create links between product and fitments
      const linkPromises = fitment_ids.map((fitmentId) =>
        link.create({
          [Modules.PRODUCT]: {
            product_id: productId,
          },
          [FITMENT_MODULE]: {
            fitment_id: fitmentId,
          },
        }),
      );

      await Promise.all(linkPromises);

      this.logger.info(
        `Successfully linked ${fitment_ids.length} fitments to product ${productId}`,
      );

      this.success({
        message: "Fitments linked successfully",
        product_id: productId,
        fitment_ids,
      });
    }, `Fitments linked to product ${this.req.params.id}`);
  }

  /**
   * DELETE /admin/products/:id/fitments/:fitmentId
   * Unlink a specific fitment from a product
   */
  async unlinkFitmentFromProduct(): Promise<void> {
    await this.execute(async () => {
      const { id: productId, fitmentId } = this.req.params;

      this.logger.info(
        `Unlinking fitment ${fitmentId} from product ${productId}`,
      );

      const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);

      // Dismiss (remove) the link between product and fitment
      await link.dismiss({
        [Modules.PRODUCT]: {
          product_id: productId,
        },
        [FITMENT_MODULE]: {
          fitment_id: fitmentId,
        },
      });

      this.logger.info(
        `Successfully unlinked fitment ${fitmentId} from product ${productId}`,
      );

      this.success({
        message: "Fitment unlinked successfully",
        product_id: productId,
        fitment_id: fitmentId,
        deleted: true,
      });
    }, `Fitment ${this.req.params.fitmentId} unlinked from product ${this.req.params.id}`);
  }

  /**
   * GET /admin/fitments/:id/products
   * Get all products linked to a fitment
   */
  async getProductsForFitment(): Promise<void> {
    await this.execute(async () => {
      const { id: fitmentId } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching products for fitment: ${fitmentId}`);

      const { data } = await query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["product.*", "product.variants.*"],
        filters: {
          fitment_id: fitmentId,
        },
      });

      const products = data.map((item) => item.product);

      this.logger.info(
        `Found ${products.length} products for fitment ${fitmentId}`,
      );

      this.success({
        products: products,
        count: products.length,
      });
    }, `Products retrieved for fitment ${this.req.params.id}`);
  }

  /**
   * POST /admin/fitments/:id/products
   * Link multiple products to a fitment
   */
  async linkProductsToFitment(): Promise<void> {
    await this.execute(async () => {
      const { id: fitmentId } = this.req.params;
      const { product_ids } = this.req.validatedBody as {
        product_ids: string[];
      };

      this.logger.info(
        `Linking ${product_ids.length} products to fitment ${fitmentId}`,
      );

      const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);

      // Create links between product and fitment
      const linkPromises = product_ids.map((productId) =>
        link.create({
          [Modules.PRODUCT]: {
            product_id: productId,
          },
          [FITMENT_MODULE]: {
            fitment_id: fitmentId,
          },
        }),
      );

      await Promise.all(linkPromises);

      this.logger.info(
        `Successfully linked ${product_ids.length} products to fitment ${fitmentId}`,
      );

      this.success({
        message: "Products linked successfully",
        fitment_id: fitmentId,
        product_ids,
      });
    }, `Products linked to fitment ${this.req.params.id}`);
  }

  /**
   * DELETE /admin/fitments/:id/products/:productId
   * Unlink a specific product from a fitment
   */
  async unlinkProductFromFitment(): Promise<void> {
    await this.execute(async () => {
      const { id: fitmentId, productId } = this.req.params;

      this.logger.info(
        `Unlinking product ${productId} from fitment ${fitmentId}`,
      );

      const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);

      // Dismiss (remove) the link between product and fitment
      await link.dismiss({
        [Modules.PRODUCT]: {
          product_id: productId,
        },
        [FITMENT_MODULE]: {
          fitment_id: fitmentId,
        },
      });

      this.logger.info(
        `Successfully unlinked product ${productId} from fitment ${fitmentId}`,
      );

      this.success({
        message: "Product unlinked successfully",
        fitment_id: fitmentId,
        product_id: productId,
        deleted: true,
      });
    }, `Product ${this.req.params.productId} unlinked from fitment ${this.req.params.id}`);
  }
}
