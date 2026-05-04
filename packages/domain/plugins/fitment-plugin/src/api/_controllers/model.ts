import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { BaseController } from "@trabara/common";
import {
  CreateModelInputSchema,
  UpdateModelInputSchema,
} from "@trabara/core/validations";

export class ModelController extends BaseController {
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching models list", {
        filters: this.req.filterableFields,
        config: this.req.queryConfig,
      });

      const { data, metadata } = await query.graph({
        entity: "fitment_model",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${data.length} models`);

      this.success({ data, metadata });
    }, "Models list retrieved successfully");
  }

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
        throw new Error("Model not found");
      }

      this.logger.info(`Found model with ID: ${id}`);

      this.success({ model: data[0] });
    }, `Model ${this.req.params.id} retrieved successfully`);
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = CreateModelInputSchema.parse(this.req.validatedBody);

      this.logger.info("Creating new model", { data: validated });

      const [model] = await service.createFitmentModels([validated]);

      this.logger.info(`Created model with ID: ${model.id}`);

      this.created({ model });
    }, "Model created successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = UpdateModelInputSchema.parse(this.req.validatedBody);

      this.logger.info(`Updating model with ID: ${id}`, { data: validated });

      const [model] = await service.updateFitmentModels([{ ...validated, id }]);

      this.logger.info(`Updated model with ID: ${id}`);

      this.success({ model });
    }, `Model ${this.req.params.id} updated successfully`);
  }

  async updateBatch(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const { models: modelUpdates } = z
        .object({
          models: z.array(UpdateModelInputSchema.extend({ id: z.string() })),
        })
        .parse(this.req.validatedBody);

      this.logger.info(`Batch updating ${modelUpdates.length} models`);

      const models = await service.updateFitmentModels(modelUpdates);

      this.logger.info(`Batch updated ${models.length} models`);

      this.success({ models });
    }, "Models batch updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

      this.logger.info(`Deleting model with ID: ${id}`);

      await service.deleteFitmentModels([id]);

      this.noContent();
    }, `Model ${this.req.params.id} deleted successfully`);
  }
}
