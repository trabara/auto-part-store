import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { BaseController } from "@trabara/common";
import {
  CreateEngineInputSchema,
  UpdateEngineInputSchema,
} from "@trabara/core/validations";
import { z } from "@medusajs/framework/zod";

export class EngineController extends BaseController {
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching engines list", {
        filters: this.req.filterableFields,
        config: this.req.queryConfig,
      });

      const { data: engines, metadata } = await query.graph({
        entity: "fitment_engine",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${engines.length} engines`);

      this.success({ data: engines, metadata });
    }, "Engines list retrieved successfully");
  }

  async getById(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching engine with ID: ${id}`);

      const { data } = await query.graph(
        {
          entity: "fitment_engine",
          fields: [
            "id",
            "fuel",
            "type",
            "size",
            "tech",
            "created_at",
            "updated_at",
            "fitments.*",
          ],
          filters: { id },
        },
        {
          throwIfKeyNotFound: true,
        },
      );

      if (!data || data.length === 0) {
        throw new Error("Engine not found");
      }

      this.logger.info(`Found engine with ID: ${id}`);

      this.success({ engine: data[0] });
    }, `Engine ${this.req.params.id} retrieved successfully`);
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = CreateEngineInputSchema.parse(this.req.validatedBody);

      this.logger.info("Creating new engine", { data: validated });

      const [engine] = await service.createFitmentEngines([validated]);

      this.logger.info(`Created engine with ID: ${engine.id}`);

      this.created({ engine });
    }, "Engine created successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = UpdateEngineInputSchema.parse(this.req.validatedBody);

      this.logger.info(`Updating engine with ID: ${id}`, { data: validated });

      const [engine] = await service.updateFitmentEngines([
        { ...validated, id },
      ]);

      this.logger.info(`Updated engine with ID: ${id}`);

      this.success({ engine });
    }, `Engine ${this.req.params.id} updated successfully`);
  }

  async updateBatch(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const { engines: engineUpdates } = z
        .object({ engines: z.array(UpdateEngineInputSchema) })
        .parse(this.req.validatedBody);

      this.logger.info(`Batch updating ${engineUpdates.length} engines`);

      const engines = await service.updateFitmentEngines(engineUpdates);

      this.logger.info(`Batch updated ${engines.length} engines`);

      this.success({ engines });
    }, "Engines batch updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

      this.logger.info(`Deleting engine with ID: ${id}`);

      await service.deleteFitmentEngines([id]);
      
      this.logger.info(`Deleted engine with ID: ${id}`);

      this.noContent();
    }, `Engine ${this.req.params.id} deleted successfully`);
  }
}
