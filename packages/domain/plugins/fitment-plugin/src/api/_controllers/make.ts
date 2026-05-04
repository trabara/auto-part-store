import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { BaseController } from "@trabara/common";
import {
  CreateMakeInputSchema,
  UpdateMakeInputSchema,
} from "@trabara/core/validations";

export class MakeController extends BaseController {
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching makes list");

      const { data, metadata } = await query.graph({
        entity: "fitment_make",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${data.length} makes`);

      this.success({ data, metadata });
    }, "Makes list retrieved successfully");
  }

  async getById(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info(`Fetching make by ID: ${id}`);

      const { data } = await query.graph(
        {
          entity: "fitment_make",
          fields: [
            "id",
            "name",
            "created_at",
            "updated_at",
            "models.*"
          ],
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

  async create(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = CreateMakeInputSchema.parse(this.req.validatedBody);

      this.logger.info(`Creating new make: ${validated.name}`);

      const [make] = await service.createFitmentMakes([validated]);

      this.logger.info(`Make created successfully: ${make.id}`);

      this.created({ make });
    }, "Make created successfully");
  }

  async updateBatch(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

      const { makes: makeUpdates } = z
        .object({
          makes: z.array(UpdateMakeInputSchema.extend({ id: z.string() })),
        })
        .parse(this.req.validatedBody);

      this.logger.info(`Updating ${makeUpdates.length} makes`);

      const makes = await service.updateFitmentMakes(makeUpdates);

      this.logger.info("Makes updated successfully");

      this.success({ makes });
    }, "Makes batch updated successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = UpdateMakeInputSchema.parse(this.req.validatedBody);

      this.logger.info(`Updating make: ${id}`);

      const [make] = await service.updateFitmentMakes([{ ...validated, id }]);

      this.logger.info("Make updated successfully");

      this.success({ make });
    }, `Make updated: ${this.req.params.id}`);
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

      this.logger.info(`Deleting make: ${id}`);

      await service.deleteFitmentMakes([id]);

      this.noContent();
    }, `Make deleted: ${this.req.params.id}`);
  }
}
