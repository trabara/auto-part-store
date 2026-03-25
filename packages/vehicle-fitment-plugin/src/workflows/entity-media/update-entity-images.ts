import {
    createWorkflow,
    transform,
    when,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { convertEntityThumbnailsStep } from "./steps/convert-entity-thumbnails"
import { updateEntityImagesStep } from "./steps/update-entity-images"

type UpdateEntityImagesInput = {
    updates: {
        id: string
        type?: "thumbnail" | "image"
    }[]
}

export const updateEntityImagesWorkflow = createWorkflow(
    "update-entity-images",
    (input: UpdateEntityImagesInput) => {
        when(input, (data) => data.updates.some((u) => u.type === "thumbnail"))
            .then(
                () => {
                    const entityImageIds = transform({
                        input,
                    }, (data) => data.input.updates.filter(
                        (u) => u.type === "thumbnail"
                    ).map((u) => u.id))
                    const { data: entityImages } = useQueryGraphStep({
                        entity: "entity_image",
                        fields: ["entity_id"],
                        filters: {
                            id: entityImageIds,
                        },
                        options: {
                            throwIfKeyNotFound: true,
                        },
                    })
                    const entityIds = transform({
                        entityImages,
                    }, (data) => data.entityImages.map((img) => img.entity_id))

                    convertEntityThumbnailsStep({
                        entity_ids: entityIds,
                    })
                }
            )
        const updatedImages = updateEntityImagesStep({
            updates: input.updates,
        })

        return new WorkflowResponse(updatedImages)
    }
)