import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { FITMENT_MODULE } from "../../modules/fitment";
import { CreateFitmentInput, UpdateFitmentInput } from "../../modules/fitment/schema";
import { deleteFitmentWorkflow } from "../../workflows";

/**
 * Fitment Controller
 *
 * Handles all fitment-related HTTP requests.
 * Following SRP: Single responsibility is handling fitment HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class FitmentController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  /**
   * GET /admin/fitments
   * List all fitments with pagination and filtering
   */
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching fitments list", {
        filters: this.req.filterableFields,
        config: this.req.queryConfig,
      });

      const { data, metadata } = await query.graph({
        entity: "fitment",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${data.length} fitments`);

      this.success({ fitments: data, metadata });
    }, "Fitments list retrieved successfully");
  }

  /**
   * GET /admin/fitments/:id
   * Get a single fitment by ID with all relations
   */
  async getById(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching fitment by ID: ${id}`);

      const { data } = await query.graph(
        {
          entity: "fitment",
          fields: [
            "id",
            "body_style",
            "drive",
            "transmission",
            "doors",
            "year_start",
            "year_end",
            "model.id",
            "model.name",
            "model.make.id",
            "model.make.name",
            "engine.id",
            "engine.fuel",
            "engine.type",
            "engine.size",
            "engine.tech",
          ],
          filters: { id },
        },
        {
          throwIfKeyNotFound: true,
        },
      );

      if (!data || data.length === 0) {
        throw new Error("Fitment not found");
      }

      this.logger.info("Fitment found successfully");

      this.success({ fitment: data[0] });
    }, `Fitment retrieved: ${this.req.params.id}`);
  }

  /**
   * POST /admin/fitments
   * Create a new fitment with nested entities (make, model, engine)
   */
  async create(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve(
        FITMENT_MODULE,
      ) as any;
      const body = this.req.validatedBody as CreateFitmentInput;

      this.logger.info("Creating new fitment", {
        data: body,
      });

      const fitment = await fitmentModuleService.createFitments(body);

      this.logger.info(`Fitment created successfully: ${fitment.id}`);

      this.success({ fitment });
    }, "Fitment created successfully");
  }

  /**
   * PATCH /admin/fitments/:id
   * Update an existing fitment
   */
  async update(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve<any>(FITMENT_MODULE);
      const body = this.req.validatedBody as UpdateFitmentInput;
      const { id } = this.req.params as Record<string, string | undefined>;

      this.logger.info("Updating fitment", {
        id,
        body,
      });

      const updated = await fitmentModuleService.updateFitments(body);

      this.logger.info(`Fitment updated successfully: ${updated.id}`);

      this.success({ fitment: updated });
    }, "Fitment updated successfully");
  }

  /**
   * DELETE /admin/fitments/:id
   * Delete a fitment by ID (including product links)
   * Uses deleteFitmentWorkflow to ensure proper cleanup of product-fitment links
   */
  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;

      this.logger.info(`Deleting fitment with links via workflow: ${id}`);

      // Execute the workflow that handles both link cleanup and fitment deletion
      const { result } = await deleteFitmentWorkflow(this.req.scope).run({
        input: { id },
      });

      this.logger.info("Fitment and links deleted successfully via workflow");

      this.success({
        id: result.id,
        object: "fitment",
        deleted: result.deleted,
      });
    }, `Fitment deleted: ${this.req.params.id}`);
  }
}
