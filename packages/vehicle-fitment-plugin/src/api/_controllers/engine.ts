import { FITMENT_MODULE } from "../../modules/fitment";
import { CreateEngineInput, UpdateEngineInput } from "../../modules/fitment/schema";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";

/**
 * Engine Controller
 *
 * Handles all engine-related HTTP requests.
 * Following SRP: Single responsibility is handling engine HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class EngineController extends BaseController {
  constructor(req, res) {
    super(req, res)
  }

  /**
   * GET /admin/engines
   * List all engines with pagination
   */
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

      this.success({ engines, metadata });
    }, "Engines list retrieved successfully");
  }

  /**
   * GET /admin/engines/:id
   * Get a single engine by ID with all relations
   */
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
        return this.handleError(new Error("Engine not found"));
      }

      this.logger.info(`Found engine with ID: ${id}`);

      this.success({ engine: data[0] });
    }, `Engine ${this.req.params.id} retrieved successfully`);
  }

  /**
   * POST /admin/engines
   * Create a new engine
   */
  async create(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve<any>(FITMENT_MODULE);

      this.logger.info("Creating new engine", {
        data: this.req.validatedBody,
      });

      const [engine] = await fitmentModuleService.createFitmentEngines([
        this.req.validatedBody as CreateEngineInput,
      ]);

      this.logger.info(`Created engine with ID: ${engine.id}`);

      this.created({ engine });
    }, "Engine created successfully");
  }

  /**
   * PATCH /admin/engines/:id
   * Update an existing engine
   */
  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE) as any;

      this.logger.info(`Updating engine with ID: ${id}`, {
        data: this.req.validatedBody,
      });

      const [engine] = await fitmentModuleService.updateFitmentEngines([
        { ...(this.req.validatedBody as UpdateEngineInput), id },
      ]);

      this.logger.info(`Updated engine with ID: ${id}`);

      this.success({ engine });
    }, `Engine ${this.req.params.id} updated successfully`);
  }

  /**
   * PATCH /admin/engines (batch update)
   * Update multiple engines at once
   */
  async updateBatch(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE) as any;
      const { engines: engineUpdates } = this.req.validatedBody as {
        engines: UpdateEngineInput[];
      };

      this.logger.info(`Batch updating ${engineUpdates.length} engines`);

      const engines =
        await fitmentModuleService.updateFitmentEngines(engineUpdates);

      this.logger.info(`Batch updated ${engines.length} engines`);

      this.success({ engines });
    }, "Engines batch updated successfully");
  }

  /**
   * DELETE /admin/engines/:id
   * Delete an engine (with cascade)
   */
  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const fitmentModuleService = this.req.scope.resolve(FITMENT_MODULE) as any;

      this.logger.info(`Deleting engine with ID: ${id}`);

      await fitmentModuleService.deleteEngineWithCascade(id);

      this.logger.info(`Deleted engine with ID: ${id}`);

      this.success({
        id,
        object: "engine",
        deleted: true,
      });
    }, `Engine ${this.req.params.id} deleted successfully`);
  }
}
