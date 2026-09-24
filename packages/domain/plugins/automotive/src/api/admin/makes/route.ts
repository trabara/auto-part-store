import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../modules/fitment";
import {
  CreateMakeInput,
  UpdateMakeBatchInput,
} from "../../../modules/fitment/validations";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Fetching makes list");

  const { data, metadata } = await query.graph({
    entity: "fitment_make",
    ...req.queryConfig,
    ...req.filterableFields,
  });

  logger.info(`Found ${data.length} makes`);

  res.status(200).json({ data, metadata });
};

export const POST = async (
  req: MedusaRequest<CreateMakeInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info(`Creating new make: ${req.validatedBody.name}`);

  const [make] = await service.createFitmentMakes([req.validatedBody]);

  logger.info(`Make created successfully: ${make.id}`);

  res.status(201).json({ make });
};

export const PATCH = async (
  req: MedusaRequest<UpdateMakeBatchInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { makes } = req.validatedBody;
  logger.info(`Updating ${makes.length} makes`);

  const updatedMakes = await service.updateFitmentMakes(makes);

  logger.info("Makes updated successfully");

  res.status(200).json({ makes: updatedMakes });
};
