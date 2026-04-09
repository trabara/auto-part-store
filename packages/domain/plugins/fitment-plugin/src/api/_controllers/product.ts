import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { FitmentModuleService } from "@repo/domain-modules/fitment";
import { FITMENT_MODULE } from "@repo/domain-modules/fitment";
import {
  ProductListInput,
  ProductListService,
} from "@repo/domain-modules/fitment/services/product-list.service";
import { BaseController } from "@trabara/common";
import FitmentProductLink from "../../links/fitment-product";

export class ProductController extends BaseController {
  readonly productService: ProductListService;

  constructor(req: MedusaRequest, res: MedusaResponse) {
    super(req, res);

    this.productService = new ProductListService(
      this.req.scope.resolve(ContainerRegistrationKeys.QUERY),
      FitmentProductLink.entryPoint,
    );
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Listing products with filters", {
        filters: this.req.filterableFields,
        queryConfig: this.req.queryConfig,
      });


      const result = await this.productService.list({
        ...(this.req.filterableFields as ProductListInput),
        queryConfig: this.req.queryConfig,
      });

      this.success(result);
    }, "Products retrieved successfully");
  }

  async search(): Promise<void> {
    await this.execute(async () => {
      const {
        q,
        currency_code,
        region_id,
        fitment_id,
        limit = 8,
      } = this.req.filterableFields as {
        q: string;
        currency_code: string;
        region_id: string;
        fitment_id?: string;
        limit?: number;
      };

      this.logger.info("Autocomplete search", { q });


      const result = await this.productService.list({
        q,
        fitment_id,
        region_id,
        currency_code,
        queryConfig: {
          fields: ["id", "title", "handle", "thumbnail"],
          pagination: { skip: 0, take: limit },
        },
      });

      this.success({ products: result.products });
    }, "Product search autocomplete");
  }

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

      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "categories.id"],
        filters: { id: product_id },
      });

      const category_id: string | undefined =
        products?.[0]?.categories?.[0]?.id;

      const result = await this.productService.list({
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

  async getFitmentsForProduct(): Promise<void> {
    await this.execute(async () => {
      const { id: productId } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

      this.logger.info(`Fetching fitments for product: ${productId}`);

      // Use the link entry point to get the fitment IDs linked to this product
      const { data: linkRows, metadata } = await query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["fitment_id"],
        filters: { product_id: productId },
      });

      const fitmentIds = linkRows
        .map((row: any) => row.fitment_id)
        .filter(Boolean);

      if (!fitmentIds.length) {
        this.success({ data: [], metadata });
        return;
      }

      // Hydrate fitments with model + make + engine via the service
      const fitments = await service.listFitmentsWithRelations({
        id: { $in: fitmentIds },
      });

      this.logger.info(
        `Found ${fitments.length} fitments for product ${productId}`,
      );

      this.success({ data: fitments, metadata });
    }, `Fitments retrieved for product ${this.req.params.id}`);
  }

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

  async unlinkFitmentFromProduct(): Promise<void> {
    await this.execute(async () => {
      const { id: productId, fitmentId } = this.req.params;

      this.logger.info(
        `Unlinking fitment ${fitmentId} from product ${productId}`,
      );

      const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);

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

      this.noContent();
    }, `Fitment ${this.req.params.fitmentId} unlinked from product ${this.req.params.id}`);
  }

  async getProductsForFitment(): Promise<void> {
    await this.execute(async () => {
      const { id: fitmentId } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching products for fitment: ${fitmentId}`);

      const { data, metadata } = await query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["product.*", "product.variants.*"],
        filters: { fitment_id: fitmentId },
      });

      const products = data.map((item) => item.product);

      this.logger.info(
        `Found ${products.length} products for fitment ${fitmentId}`,
      );

      this.success({
        data: products,
        metadata,
      });
    }, `Products retrieved for fitment ${this.req.params.id}`);
  }

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

  async unlinkProductFromFitment(): Promise<void> {
    await this.execute(async () => {
      const { id: fitmentId, productId } = this.req.params;

      this.logger.info(
        `Unlinking product ${productId} from fitment ${fitmentId}`,
      );

      const link = this.req.scope.resolve(ContainerRegistrationKeys.LINK);

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

      this.noContent();
    }, `Product ${this.req.params.productId} unlinked from fitment ${this.req.params.id}`);
  }
}
