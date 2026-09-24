import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE, FitmentModuleService } from "../../modules/fitment";

type DeleteFitmentsStepInput = {
  ids: string[];
};
export const deleteFitmentsStep = createStep(
  "delete-fitments-step",
  async ({ ids }: DeleteFitmentsStepInput, { container }) => {
    const fitmentModuleService =
      container.resolve<FitmentModuleService>(FITMENT_MODULE);

    await fitmentModuleService.deleteVehicles(ids);
    return new StepResponse({}, { ids });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const fitmentModuleService =
      container.resolve<FitmentModuleService>(FITMENT_MODULE);

    await fitmentModuleService.restoreVehicles(compensation.ids);
  },
);
