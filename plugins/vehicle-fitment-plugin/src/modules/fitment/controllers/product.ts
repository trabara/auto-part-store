import FitmentProductLink from "../../../links/fitment-product";
import { FITMENT_MODULE } from "..";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import {
  ProductListInput,
  ProductListService,
} from "../services/product-list.service";

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

      this.logger.info("Listing products with filters", {
        filters: this.req.filterableFields,
        queryConfig: this.req.queryConfig,
      });

      const service = new ProductListService(query);
      const result = await service.list({
        ...(this.req.filterableFields as ProductListInput),
        queryConfig: this.req.queryConfig,
      });

      this.success(result);
    }, "Products retrieved successfully");
  }

  /**
   * GET /store/products/v2/related
   * Returns products from the same category as the given product_id,
   * excluding the source product itself.
   */
  async related(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { product_id, currency_code, region_id, fitment_id } = this.req
        .filterableFields as {
        product_id: string;
        currency_code: string;
        region_id: string;
        fitment_id?: string;
      };

      this.logger.info("Fetching related products", { product_id });

      // Resolve the product's primary category
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id: product_id },
      });

      const category_id: string | undefined =
        products?.[0]?.categories?.[0]?.id;

      const service = new ProductListService(query);
      const result = await service.list({
        region_id,
        currency_code,
        fitment_id,
        category_id,
        exclude_id: product_id,
        queryConfig: this.req.queryConfig,
      });

      this.success(result);
    }, "Related products retrieved successfully");
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
