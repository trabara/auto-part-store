import { createStep } from "@medusajs/framework/workflows-sdk";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";

type DeleteFitmentsStepInput = {
  ids: string[];
};
export const deleteFitmentsStep = createStep(
  "delete-fitments-step",
  async ({ ids }: DeleteFitmentsStepInput, { container }) => {
    const fitmentModuleService =
      container.resolve<FitmentModuleService>(FITMENT_MODULE);

    await fitmentModuleService.deleteFitmentsData(ids);
  },
  async ({ ids }: DeleteFitmentsStepInput, { container }) => {
    const fitmentModuleService =
      container.resolve<FitmentModuleService>(FITMENT_MODULE);

    await fitmentModuleService.restoreFitments(ids);
  },
);
