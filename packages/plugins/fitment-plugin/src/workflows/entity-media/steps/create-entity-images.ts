import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ENTITY_MEDIA_MODULE } from "../../../modules/entity-media"
import EntityMediaModuleService from "../../../modules/entity-media/service"

export type CreateEntityImagesStepInput = {
    images: {
        entity_id: string
        type: "thumbnail" | "image"
        url: string
        file_id: string
    }[]
}

export const createEntityImagesStep = createStep(
    "create-entity-images-step",
    async (input: CreateEntityImagesStepInput, { container }) => {
        const entityMediaService: EntityMediaModuleService =
            container.resolve(ENTITY_MEDIA_MODULE)

        // Group images by entity to handle thumbnails efficiently
        const imagesByEntity = input.images.reduce((acc, img) => {
            if (!acc[img.entity_id]) {
                acc[img.entity_id] = []
            }
            acc[img.entity_id].push(img)
            return acc
        }, {} as Record<string, typeof input.images>)

        // Process each entity
        for (const [_, images] of Object.entries(imagesByEntity)) {
            const thumbnailImages = images.filter((img) => img.type === "thumbnail")

            // If there are new thumbnails for this entity, convert existing ones to "image"
            if (thumbnailImages.length > 1) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Only one thumbnail is allowed per entity"
                )
            }
        }

        // Create all entity images
        const createdImages = await entityMediaService.createEntityImages(
            Object.values(imagesByEntity).flat()
        )

        return new StepResponse(createdImages, createdImages)
    },
    async (compensationData, { container }) => {
        if (!compensationData?.length) {
            return
        }

        const entityMediaService: EntityMediaModuleService =
            container.resolve(ENTITY_MEDIA_MODULE)

        await entityMediaService.deleteEntityImages(
            compensationData
        )
    }
)