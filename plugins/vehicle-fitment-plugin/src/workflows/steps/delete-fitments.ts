import { createStep } from "@medusajs/framework/workflows-sdk";

type DeleteFitmentsStepInput = {
    ids: string[]
}
export const deleteFitmentsStep = createStep(
    "delete-fitments",
    async ({ ids }: DeleteFitmentsStepInput, { container }) => {
        const fitmentModuleService = container.resolve("fitment") as any

        await fitmentModuleService.deleteFitments(ids)
    },
    async ({ ids }: DeleteFitmentsStepInput, { container }) => {
        const fitmentModuleService = container.resolve("fitment") as any

        await fitmentModuleService.restoreFitments(ids)
    }
)