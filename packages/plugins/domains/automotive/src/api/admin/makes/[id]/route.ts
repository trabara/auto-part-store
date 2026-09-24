import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../../modules/fitment";
import { UpdateMakeInput } from "../../../../modules/fitment/validations";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info(`Fetching make by ID: ${id}`);

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

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
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Make not found");
  }

  logger.info("Make found successfully");

  res.status(200).json({ make: data[0] });
};

export const PATCH = async (
  req: MedusaRequest<UpdateMakeInput>,
  res: MedusaResponse,
) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const { id } = req.params;

  logger.info(`Updating make: ${id}`);

  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const [make] = await service.updateFitmentMakes([
    { ...req.validatedBody, id },
  ]);

  logger.info("Make updated successfully");

  res.status(200).json({ make });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

  logger.info(`Deleting make: ${id}`);

  await service.deleteFitmentMakes([id]);
};
