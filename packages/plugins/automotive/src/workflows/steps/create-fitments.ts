import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE, FitmentModuleService } from "../../modules/fitment";
import { CreateVehicleInput } from "../../modules/fitment/dto";

export const createFitmentsStep = createStep(
  "create-fitments-step",
  async (input: CreateVehicleInput[], { container }) => {
    const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    const fitments = await service.createVehicles(input);

    return new StepResponse(
      { fitments },
      { fitmentIds: fitments.map((f) => f.id) },
    );
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    await service.deleteVehicles(compensation.fitmentIds);
  },
);
