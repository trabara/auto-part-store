import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createEntityImagesStep } from "./steps/create-entity-images";
import { convertEntityThumbnailsStep } from "./steps/convert-entity-thumbnails";
import { EntityImage } from "@trabara/core/dtos";

type CreateEntityImagesInput = {
  images: EntityImage[];
};

export const createEntityImagesWorkflow = createWorkflow(
  "create-entity-images",
  (input: CreateEntityImagesInput) => {
    when(input, (data) =>
      data.images.some((img) => img.type === "thumbnail"),
    ).then(() => {
      const entityIds = transform(
        {
          input,
        },
        (data) => {
          return data.input.images
            .filter((img) => img.type === "thumbnail")
            .map((img) => img.entity_id);
        },
      );

      convertEntityThumbnailsStep({
        entity_ids: entityIds,
      });
    });

    const entityImages = createEntityImagesStep({
      images: input.images,
    });

    return new WorkflowResponse(entityImages);
  },
);
