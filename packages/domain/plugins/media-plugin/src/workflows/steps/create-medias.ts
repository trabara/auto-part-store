import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type CreateMediasStepInput = {
  medias: {
    entity_id: string;
    type: "thumbnail" | "image";
    url: string;
    file_id: string;
  }[];
};

export const createMediasStep = createStep(
  "create-medias-step",
  async (input: CreateMediasStepInput, { container }) => {
    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Group medias by entity to handle thumbnails efficiently
    const mediasByEntity = input.medias.reduce(
      (acc, media) => {
        if (!acc[media.entity_id]) {
          acc[media.entity_id] = [];
        }
        acc[media.entity_id].push(media);
        return acc;
      },
      {} as Record<string, typeof input.medias>,
    );

    // Process each entity
    for (const [_, medias] of Object.entries(mediasByEntity)) {
      const thumbnailMedias = medias.filter((media) => media.type === "thumbnail");

      // If there are new thumbnails for this entity, convert existing ones to "image"
      if (thumbnailMedias.length > 1) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Only one thumbnail is allowed per entity",
        );
      }
    }

    // Create all entity medias
    const createdMedias = await mediaService.createMedias(
      Object.values(mediasByEntity).flat(),
    );

    return new StepResponse(
      createdMedias,
      createdMedias.map((media) => media.id),
    );
  },
  async (compensationData, { container }) => {
    if (!compensationData?.length) {
      return;
    }

    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    await mediaService.deleteMedias(compensationData);
  },
);
