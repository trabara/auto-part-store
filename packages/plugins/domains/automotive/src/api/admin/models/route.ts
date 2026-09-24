import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../modules/fitment";
import {
  CreateModelInput,
  UpdateModelBatchInput,
} from "../../../modules/fitment/validations";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(
    `Fetching models list ${JSON.stringify({
      filters: req.filterableFields,
      config: req.queryConfig,
    })}`,
  );

  const { data, metadata } = await query.graph({
    entity: "fitment_model",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  logger.info(`Found ${data.length} models`);
  res.status(200).json({ data, metadata });
};

export const POST = async (
  req: MedusaRequest<CreateModelInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Creating new model ${JSON.stringify(req.validatedBody)} }`);

  const [model] = await service.createFitmentModels([req.validatedBody]);

  logger.info(`Created model with ID: ${model.id}`);

  res.status(201).json({ model });
};

export const PATCH = async (
  req: MedusaRequest<UpdateModelBatchInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { models } = req.validatedBody;
  logger.info(`Batch updating ${models.length} models`);

  const updatedModels = await service.updateFitmentModels(models);

  logger.info(`Batch updated ${updatedModels.length} models`);

  res.status(200).json({ models: updatedModels });
};
