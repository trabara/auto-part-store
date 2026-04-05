import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type ConvertEntityThumbnailsStepInput = {
  entity_ids: string[];
};

export const convertEntityThumbnailsStep = createStep(
  "convert-entity-thumbnails-step",
  async (input: ConvertEntityThumbnailsStepInput, { container }) => {
    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Find existing thumbnails in the specified entities
    const existingThumbnails = await mediaService.listMedias({
      type: "thumbnail",
      entity_id: input.entity_ids,
    });

    if (existingThumbnails.length === 0) {
      return new StepResponse([], []);
    }

    // Store previous states for compensation
    const compensationData: string[] = existingThumbnails.map((t) => t.id);

    // Convert existing thumbnails to "image" type
    await mediaService.updateMedias(
      existingThumbnails.map((t) => ({
        id: t.id,
        type: "image" as const,
      })),
    );

    return new StepResponse(existingThumbnails, compensationData);
  },
  async (compensationData, { container }) => {
    if (!compensationData?.length) {
      return;
    }

    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Revert thumbnails back to "thumbnail" type
    await mediaService.updateMedias(
      compensationData.map((id) => ({
        id,
        type: "thumbnail" as const,
      })),
    );
  },
);
