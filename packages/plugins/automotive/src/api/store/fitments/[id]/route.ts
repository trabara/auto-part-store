import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../../modules/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

  const { id } = req.params;

  logger.info(`Fetching fitment by ID: ${id}`);

  const fitment = await service.retrieveFitment(id, {
    relations: ["model", "model.make", "engine"],
  });

  if (!fitment) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fitment with id ${id} not found`,
    );
  }

  logger.info("Fitment found successfully");

  res.status(200).json({ fitment });
};
