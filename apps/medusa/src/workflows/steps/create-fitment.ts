import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "../../modules/fitment";
import { CreateFitmentInput } from "../../modules/fitment/schema";


export const createFitmentStep = createStep(
    "create-fitment-step",
    async function (input: CreateFitmentInput, { container }) {
        const fitmentModuleService = container.resolve(FITMENT_MODULE);

        const make = await fitmentModuleService.createMakes({ name: input.model.make.name });
        const model = await fitmentModuleService.createModels({ name: input.model.name, make_id: make.id });
        const engine = await fitmentModuleService.createEngines(input.engine);

        const fitment = await fitmentModuleService.createFitments({
            model_id: model.id,
            engine_id: engine.id,
            body_style: input.body_style,
            drive: input.drive,
            transmission: input.transmission,
            year_start: input.year_start,
            year_end: input.year_end,
        });

        if (input.product_id) {
            const link = await container.resolve(ContainerRegistrationKeys.LINK)
            await link.create({
                [Modules.PRODUCT]: {
                    product_id: input.product_id,
                },
                [FITMENT_MODULE]: {
                    fitment_id: fitment.id,
                }
            })
        }

        return new StepResponse({ fitment }, { fitment_id: fitment.id });
    },
    async function (input, { container }) {
        if (!input) {
            return
        }
        const fitmentModuleService = container.resolve(FITMENT_MODULE);
        return fitmentModuleService.deleteFitments([input.fitment_id]);
    }
);