import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { convertEntityThumbnailsStep } from "./steps/convert-thumbnails";
import { listMediasStep } from "./steps/list-medias";
import { updateMediasStep } from "./steps/update-medias";

type UpdateMediasInput = {
  updates: {
    id: string;
    type?: "thumbnail" | "image";
  }[];
};

export const updateMediasWorkflow = createWorkflow(
  "update-medias",
  (input: UpdateMediasInput) => {
    when(input, (data) =>
      data.updates.some((u) => u.type === "thumbnail"),
    ).then(() => {
      const mediaIds = transform(
        {
          input,
        },
        (data) =>
          data.input.updates
            .filter((u) => u.type === "thumbnail")
            .map((u) => u.id),
      );

      const medias = listMediasStep({
        filters: { id: mediaIds },
        fields: ["entity_id"],
      });

      const entityIds = transform(
        {
          medias,
        },
        (data) => (data.medias as any[]).map((img) => img.entity_id),
      );

      convertEntityThumbnailsStep({
        entity_ids: entityIds,
      });
    });
    const updatedMedias = updateMediasStep({
      updates: input.updates,
    });

    return new WorkflowResponse(updatedMedias);
  },
);
