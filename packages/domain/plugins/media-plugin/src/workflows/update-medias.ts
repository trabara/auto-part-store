import {
    createWorkflow,
    transform,
    when,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { convertEntityThumbnailsStep } from "./steps/convert-thumbnails"
import { updateMediasStep } from "./steps/update-medias"

type UpdateMediasInput = {
    updates: {
        id: string
        type?: "thumbnail" | "image"
    }[]
}

export const updateMediasWorkflow = createWorkflow(
    "update-medias",
    (input: UpdateMediasInput) => {
        when(input, (data) => data.updates.some((u) => u.type === "thumbnail"))
            .then(
                () => {
                    const mediaIds = transform({
                        input,
                    }, (data) => data.input.updates.filter(
                        (u) => u.type === "thumbnail"
                    ).map((u) => u.id))
                    const { data: medias } = useQueryGraphStep({
                        entity: "entity_media",
                        fields: ["entity_id"],
                        filters: {
                            id: mediaIds,
                        },
                        options: {
                            throwIfKeyNotFound: true,
                        },
                    })
                    const entityIds = transform({
                        medias,
                    }, (data) => data.medias.map((img) => img.entity_id))

                    convertEntityThumbnailsStep({
                        entity_ids: entityIds,
                    })
                }
            )
        const updatedMedias = updateMediasStep({
            updates: input.updates,
        })

        return new WorkflowResponse(updatedMedias)
    }
)