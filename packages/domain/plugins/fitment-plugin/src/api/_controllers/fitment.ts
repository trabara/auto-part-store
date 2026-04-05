import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { BaseController } from "@trabara/common";
import {
  CreateFitmentInputSchema,
  UpdateFitmentInputSchema,
} from "@trabara/core/validations";
import { deleteFitmentWorkflow } from "../../workflows";

export class FitmentController extends BaseController {
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

      this.success({ data, metadata });
    }, "Fitments list retrieved successfully");
  }

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

  async create(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const validated = CreateFitmentInputSchema.parse(this.req.validatedBody);

      this.logger.info("Creating new fitment", { data: validated });

      const [fitment] = await service.createFitments([validated]);

      this.logger.info(`Fitment created successfully: ${fitment.id}`);

      this.created({ fitment });
    }, "Fitment created successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service =
        this.req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
      const { id } = this.req.params;
      const validated = UpdateFitmentInputSchema.parse(this.req.validatedBody);

      this.logger.info("Updating fitment", { id, data: validated });

      const [updated] = await service.updateFitments([{ ...validated, id }]);

      this.logger.info(`Fitment updated successfully: ${updated.id}`);

      this.success({ fitment: updated });
    }, "Fitment updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;

      this.logger.info(`Deleting fitment with links via workflow: ${id}`);

      await deleteFitmentWorkflow(this.req.scope).run({ input: { id } });

      this.noContent();
    }, `Fitment deleted: ${this.req.params.id}`);
  }
}
