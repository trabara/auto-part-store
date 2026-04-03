import {
    createWorkflow,
    transform,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteFilesWorkflow, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { deleteEntityImagesStep } from "./steps/delete-entity-images"

export type DeleteEntityImagesInput = {
    ids: string[]
}

export const deleteEntityImagesWorkflow = createWorkflow(
    "delete-entity-images",
    (input: DeleteEntityImagesInput) => {
        // First, get the entity images to retrieve the file_ids
        const { data: entityImages } = useQueryGraphStep({
            entity: "entity_image",
            fields: ["id", "file_id", "url", "type", "entity_id"],
            filters: {
                id: input.ids,
            },
            options: {
                throwIfKeyNotFound: true,
            },
        })

        // Transform the entity images to extract file IDs
        const fileIds = transform(
            { entityImages },
            (data) => data.entityImages.map((img) => img.file_id)
        )

        // Delete the files from storage
        deleteFilesWorkflow.runAsStep({
            input: {
                ids: fileIds,
            },
        })

        // Then delete the entity image records
        const result = deleteEntityImagesStep({ ids: input.ids })

        return new WorkflowResponse(result)
    }
)