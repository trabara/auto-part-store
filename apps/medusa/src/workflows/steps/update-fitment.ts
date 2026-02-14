import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "../../modules/fitment";
import { UpdateFitmentInput } from "../../modules/fitment/schema";

export const updateFitmentStep = createStep(
    "update-fitment-step",
    async function (input: UpdateFitmentInput, { container }) {
        const fitmentModuleService = container.resolve(FITMENT_MODULE);
        const fitment = await fitmentModuleService.updateFitments(input);
        return new StepResponse(fitment, { fitment_id: fitment.id });
    },
    async function (input, { container }) {
        if (!input) {
            return
        }
        const fitmentModuleService = container.resolve(FITMENT_MODULE);
        return fitmentModuleService.deleteFitments([input.fitment_id]);
    }
);