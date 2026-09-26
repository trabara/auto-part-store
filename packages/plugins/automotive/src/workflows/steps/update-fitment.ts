import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE, FitmentModuleService } from "../../modules/fitment";
import { UpdateVehicleInput } from "../../modules/fitment/dtos/vehicle";

export const updateFitmentStep = createStep(
  "update-fitment-step",
  async (input: UpdateVehicleInput, { container }) => {
    const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);

    const [originalFitment] = await service.listVehicles(
      { id: input.id },
      { relations: ["model", "engine"] },
    );

    const [updatedFitment] = await service.updateVehicles([input]);

    return new StepResponse(updatedFitment, {
      id: input.id,
      originalData: {
        model_id: originalFitment.model_id,
        // engine_id: originalFitment.engine_id,
        body_style: originalFitment.body_style,
        doors: originalFitment.doors,
        drive: originalFitment.drive,
        transmission: originalFitment.transmission,
        year_start: originalFitment.year_start,
        year_end: originalFitment.year_end ?? undefined,
      },
    });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    await service.updateVehicles([
      {
        id: compensation.id,
        ...compensation.originalData,
      },
    ]);
  },
);
