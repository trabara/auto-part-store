import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  FITMENT_MODULE,
  type FitmentModuleService,
} from "../../../../modules/fitment";
import { UpdateVehicleInput } from "../../../../modules/fitment/dto";
import { deleteFitmentWorkflow } from "../../../../workflows";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);

  const { id } = req.params;

  logger.info(`Fetching fitment by ID: ${id}`);

  const fitment = await service.retrieveVehicle(id, {
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

export const PATCH = async (
  req: MedusaRequest<UpdateVehicleInput>,
  res: MedusaResponse,
) => {
  const service = req.scope.resolve<FitmentModuleService>(FITMENT_MODULE);
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { id } = req.params;

  logger.info(
    `Updating fitment ${JSON.stringify({ id, data: req.validatedBody })}`,
  );

  const [updated] = await service.updateVehicles([
    { ...req.validatedBody, id },
  ]);

  logger.info(`Fitment updated successfully: ${updated.id}`);

  res.status(200).json({ fitment: updated });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const { id } = req.params;

  logger.info(`Deleting fitment with links via workflow: ${id}`);

  await deleteFitmentWorkflow(req.scope).run({ input: { id } });
};
