import { FITMENT_MODULE } from "@repo/domain-modules/fitment";
import { CreateMakeInput, UpdateMakeInput } from "@trabara/core/dtos";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@trabara/common";

/**
 * Make Controller
 *
 * Handles all vehicle make-related HTTP requests.
 * Following SRP: Single responsibility is handling make HTTP requests.
 * Following DIP: Depends on abstraction (BaseController).
 */
export class MakeController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  /**
   * GET /admin/makes
   * List all vehicle makes
   */
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching makes list");

      const { data: makes, metadata } = await query.graph({
        entity: "fitment_make",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${makes.length} makes`);

      this.success({ makes, metadata });
    }, "Makes list retrieved successfully");
  }

  /**
   * GET /admin/makes/:id
   * Get a single make by ID with related models
   */
  async getById(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching make by ID: ${id}`);

      const { data } = await query.graph(
        {
          entity: "fitment_make",
          fields: ["id", "name", "created_at", "updated_at", "models.*"],
          filters: { id },
        },
        {
          throwIfKeyNotFound: true,
        },
      );

      if (!data || data.length === 0) {
        throw new Error("Make not found");
      }

      this.logger.info("Make found successfully");

      this.success({ make: data[0] });
    }, `Make retrieved: ${this.req.params.id}`);
  }

  /**
   * POST /admin/makes
   * Create a new vehicle make
   */
  async create(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve<any>(FITMENT_MODULE);
      const body = this.req.validatedBody as CreateMakeInput;

      this.logger.info(`Creating new make: ${body.name}`);

      const [make] = await fitmentModuleService.createFitmentMakes([body]);

      this.logger.info(`Make created successfully: ${make.id}`);

      this.created({ make });
    }, "Make created successfully");
  }

  /**
   * PATCH /admin/makes
   * Update multiple makes
   */
  async updateBatch(): Promise<void> {
    await this.execute(async () => {
      const fitmentModuleService = this.req.scope.resolve(
        FITMENT_MODULE,
      ) as any;
      const { makes: makeUpdates } = this.req.validatedBody as {
        makes: UpdateMakeInput[];
      };

      this.logger.info(`Updating ${makeUpdates.length} makes`);

      const makes = await fitmentModuleService.updateFitmentMakes(makeUpdates);

      this.logger.info("Makes updated successfully");

      this.success({ makes });
    }, "Makes batch updated successfully");
  }

  /**
   * PATCH /admin/makes/:id
   * Update a single make by ID
   */
  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const fitmentModuleService = this.req.scope.resolve(
        FITMENT_MODULE,
      ) as any;
      const body = this.req.validatedBody as UpdateMakeInput;

      this.logger.info(`Updating make: ${id}`);

      const [make] = await fitmentModuleService.updateFitmentMakes([
        { ...body, id },
      ]);

      this.logger.info("Make updated successfully");

      this.success({ make });
    }, `Make updated: ${this.req.params.id}`);
  }

  /**
   * DELETE /admin/makes/:id
   * Delete a make and cascade delete related entities
   */
  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const fitmentModuleService = this.req.scope.resolve(
        FITMENT_MODULE,
      ) as any;

      this.logger.info(`Deleting make with cascade: ${id}`);

      await fitmentModuleService.deleteMakeWithCascade(id);

      this.logger.info("Make deleted successfully");

      this.success({
        id,
        object: "make",
        deleted: true,
      });
    }, `Make deleted: ${this.req.params.id}`);
  }
}
