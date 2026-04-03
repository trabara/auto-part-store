import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { UpdateFitmentInput } from "@trabara/core/dtos";

export const updateFitmentStep = createStep(
  "update-fitment-step",
  async function (input: UpdateFitmentInput, { container }) {
    const fitmentModuleService =
      container.resolve<FitmentModuleService>(FITMENT_MODULE);

    // First, retrieve the original fitment data for compensation
    const [originalFitment] = await fitmentModuleService.listFitments({
      id: input.id,
    });

    // Now update the fitment
    const updatedFitment = await fitmentModuleService.updateFitment(input);

    return new StepResponse(updatedFitment, {
      id: input.id,
      originalData: {
        model_id: originalFitment.model_id,
        engine_id: originalFitment.engine_id,
        body_style: originalFitment.body_style,
        doors: originalFitment.doors,
        drive: originalFitment.drive,
        transmission: originalFitment.transmission,
        year_start: originalFitment.year_start,
        year_end: originalFitment.year_end ?? undefined,
      },
    });
  },
  async function (compensationData, { container }) {
    if (!compensationData) {
      return;
    }

    // Rollback: restore the original fitment data
    const fitmentModuleService =
      container.resolve<FitmentModuleService>(FITMENT_MODULE);
    await fitmentModuleService.updateFitment({
      id: compensationData.id,
      ...compensationData.originalData,
    });
  },
);
