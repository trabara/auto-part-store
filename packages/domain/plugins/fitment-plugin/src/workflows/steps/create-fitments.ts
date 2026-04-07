import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { CreateFitmentInput } from "@trabara/core/dtos";

export const createFitmentsStep = createStep(
  "create-fitments-step",
  async (input: CreateFitmentInput[], { container }) => {
    const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    const fitments = await service.createFitments(input);

    return new StepResponse(
      { fitments },
      { fitmentIds: fitments.map((f) => f.id) },
    );
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    await service.deleteFitmentsData(compensation.fitmentIds);
  },
);
