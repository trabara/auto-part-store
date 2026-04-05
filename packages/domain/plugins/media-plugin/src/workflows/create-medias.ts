import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Media } from "@trabara/core/dtos";
import { convertEntityThumbnailsStep } from "./steps/convert-thumbnails";
import { createMediasStep } from "./steps/create-medias";

type CreateMediasInput = {
  medias: Media[];
};

export const createMediasWorkflow = createWorkflow(
  "create-medias",
  (input: CreateMediasInput) => {
    when(input, (data) =>
      data.medias.some((m) => m.type === "thumbnail"),
    ).then(() => {
      const entityIds = transform(
        {
          input,
        },
        (data) => {
          return data.input.medias
            .filter((m) => m.type === "thumbnail")
            .map((m) => m.entity_id);
        },
      );

      convertEntityThumbnailsStep({
        entity_ids: entityIds,
      });
    });

    const medias = createMediasStep({
      medias: input.medias,
    });

    return new WorkflowResponse(medias);
  },
);
