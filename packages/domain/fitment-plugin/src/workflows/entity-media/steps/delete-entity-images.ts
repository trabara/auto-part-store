import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ENTITY_MEDIA_MODULE } from "../../../modules/entity-media"
import EntityMediaModuleService from "../../../modules/entity-media/service"


export type DeleteEntityImagesStepInput = {
    ids: string[]
}

export const deleteEntityImagesStep = createStep(
    "delete-entity-images-step",
    async (input: DeleteEntityImagesStepInput, { container }) => {
        const entityMediaService: EntityMediaModuleService =
            container.resolve(ENTITY_MEDIA_MODULE)

        // Retrieve the full entity images data before deleting
        const entityImages = await entityMediaService.listEntityImages({
            id: input.ids,
        })

        // Delete the entity images
        await entityMediaService.deleteEntityImages(input.ids)

        return new StepResponse(
            { success: true, deleted: input.ids },
            entityImages
        )
    },
    async (entityImages, { container }) => {
        if (!entityImages || entityImages.length === 0) {
            return
        }

        const entityMediaService: EntityMediaModuleService =
            container.resolve(ENTITY_MEDIA_MODULE)

        // Recreate all entity images with their original data
        await entityMediaService.createEntityImages(
            entityImages.map((entityImage) => ({
                id: entityImage.id,
                entity_id: entityImage.entity_id,
                type: entityImage.type,
                url: entityImage.url,
                file_id: entityImage.file_id,
            }))
        )
    }
)