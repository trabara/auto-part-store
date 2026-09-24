import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteFilesWorkflow } from "@medusajs/medusa/core-flows";
import { deleteMediasStep } from "./steps/delete-medias";
import { listMediasStep } from "./steps/list-medias";

export type DeleteMediasInput = {
  ids: string[];
};

export const deleteMediasWorkflow = createWorkflow(
  "delete-medias",
  (input: DeleteMediasInput) => {
    // First, get the entity medias to retrieve the file_ids
    const medias = listMediasStep({
      filters: { id: input.ids },
      fields: ["id", "file_id", "url", "type", "entity_id"],
    });

    // Transform the entity medias to extract file IDs
    const fileIds = transform({ medias }, (data) =>
      (data.medias as any[]).map((img) => img.file_id),
    );

    // Delete the files from storage
    deleteFilesWorkflow.runAsStep({
      input: {
        ids: fileIds,
      },
    });

    // Then delete the entity media records
    const result = deleteMediasStep({ ids: input.ids });

    return new WorkflowResponse(result);
  },
);
