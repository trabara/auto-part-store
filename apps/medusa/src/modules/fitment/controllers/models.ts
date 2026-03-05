import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { FITMENT_MODULE } from "..";
import { CreateModelInput, UpdateModelInput } from "../schema";

/**
 * Models Controller
 *
 * Handles all model-related HTTP requests.
 * Following SRP: Single responsibility is handling model HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class ModelsController extends BaseController {
  constructor(req: MedusaRequest, res: MedusaResponse) {
    super(req, res);
  }

  /**
   * GET /admin/models
   * List all models with pagination
   */
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching models list", {
        filters: this.req.filterableFields,
        config: this.req.queryConfig,
      });

      const { data: models, metadata } = await query.graph({
        entity: "fitment_model",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${models.length} models`);

      this.success({ models, metadata });
    }, "Models list retrieved successfully");
  }

  /**
   * GET /admin/models/:id
   * Get a single model by ID with all relations
   */
  async getById(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching model with ID: ${id}`);

      const { data } = await query.graph(
        {
          entity: "fitment_model",
          fields: [
            "id",
            "name",
            "created_at",
            "updated_at",
            "make.id",
            "make.name",
            "fitments.*",
          ],
          filters: { id },
        },
        {
          throwIfKeyNotFound: true,
        },
      );

      if (!data || data.length === 0) {
        return this.handleError(new Error("Model not found"));
      }

      this.logger.info(`Found model with ID: ${id}`);

      this.success({ model: data[0] });
    }, `Model ${this.req.params.id} retrieved successfully`);
  }

  /**
   * POST /admin/models
   * Create a new model
   */
  async create(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE);

      this.logger.info("Creating new model", {
        data: this.req.validatedBody,
      });

      const model = await fitmentModuleService.createFitmentModels(
        this.req.validatedBody as CreateModelInput,
      );

      this.logger.info(`Created model with ID: ${model.id}`);

      this.created({ model });
    }, "Model created successfully");
  }

  /**
   * PATCH /admin/models/:id
   * Update an existing model
   */
  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE);

      this.logger.info(`Updating model with ID: ${id}`, {
        data: this.req.validatedBody,
      });

      const [model] = await fitmentModuleService.updateFitmentModels([
        { ...(this.req.validatedBody as UpdateModelInput), id },
      ]);

      this.logger.info(`Updated model with ID: ${id}`);

      this.success({ model });
    }, `Model ${this.req.params.id} updated successfully`);
  }

  /**
   * PATCH /admin/models (batch update)
   * Update multiple models at once
   */
  async updateBatch(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE);
      const { models: modelUpdates } = this.req.validatedBody as {
        models: UpdateModelInput[];
      };

      this.logger.info(`Batch updating ${modelUpdates.length} models`);

      const models =
        await fitmentModuleService.updateFitmentModels(modelUpdates);

      this.logger.info(`Batch updated ${models.length} models`);

      this.success({ models });
    }, "Models batch updated successfully");
  }

  /**
   * DELETE /admin/models/:id
   * Delete a model (with cascade)
   */
  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE);

      this.logger.info(`Deleting model with ID: ${id}`);

      await fitmentModuleService.deleteModelWithCascade(id);

      this.logger.info(`Deleted model with ID: ${id}`);

      this.success({
        id,
        object: "model",
        deleted: true,
      });
    }, `Model ${this.req.params.id} deleted successfully`);
  }
}
