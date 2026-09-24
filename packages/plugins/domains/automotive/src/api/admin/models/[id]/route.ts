import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
    FITMENT_MODULE,
    type FitmentModuleService,
} from "../../../../modules/fitment";
import { UpdateMakeBatchInput } from "../../../../modules/fitment/validations";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Fetching model with ID: ${id}`);

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

  logger.info(`Found model with ID: ${id}`);

  res.status(200).json({ model: data[0] });
};

export const PATCH = async (
  req: MedusaRequest<UpdateMakeBatchInput>,
  res: MedusaResponse,
) => {
  const { id } = req.params;
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Updating model with ID: ${id} { data: ${JSON.stringify(req.validatedBody)} }`,
  );

  const [model] = await service.updateFitmentModels([
    { ...req.validatedBody, id },
  ]);

  logger.info(`Updated model with ID: ${id}`);

  res.status(200).json({ model });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { id } = req.params;

  logger.info(`Deleting model with ID: ${id}`);

  await service.deleteFitmentModels([id]);

  res.status(200).json({ entity: "fitment_model", id, deleted: true });
};
