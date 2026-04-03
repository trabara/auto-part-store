import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ENTITY_MEDIA_MODULE } from "../../../modules/entity-media"
import EntityMediaModuleService from "../../../modules/entity-media/service"

export type UpdateEntityImagesStepInput = {
    updates: {
        id: string
        type?: "thumbnail" | "image"
    }[]
}

export const updateEntityImagesStep = createStep(
    "update-entity-images-step",
    async (input: UpdateEntityImagesStepInput, { container }) => {
        const entityMediaService: EntityMediaModuleService =
            container.resolve(ENTITY_MEDIA_MODULE)

        // Get previous data for the images being updated
        const prevData = await entityMediaService.listEntityImages({
            id: input.updates.map((u) => u.id),
        })

        // Apply the requested updates
        const updatedData = await entityMediaService.updateEntityImages(
            input.updates
        )

        return new StepResponse(updatedData, prevData)
    },
    async (compensationData, { container }) => {
        if (!compensationData?.length) {
            return
        }

        const entityMediaService: EntityMediaModuleService =
            container.resolve(ENTITY_MEDIA_MODULE)

        // Revert all updates
        await entityMediaService.updateEntityImages(
            compensationData.map((img) => ({
                id: img.id,
                type: img.type,
            }))
        )
    }
)