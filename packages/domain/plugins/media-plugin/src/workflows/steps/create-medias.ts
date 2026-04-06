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

// ---------------------------------------------------------------------------
// Named handler functions — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeCreateMedias(
  input: CreateMediasStepInput,
  container: { resolve: (key: string) => any },
): Promise<{ output: any; compensation: string[] }> {
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
    const thumbnailMedias = medias.filter(
      (media) => media.type === "thumbnail",
    );

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

  return {
    output: createdMedias,
    compensation: createdMedias.map((media) => media.id),
  };
}

export async function compensateCreateMedias(
  compensationData: string[] | undefined,
  container: { resolve: (key: string) => any },
): Promise<void> {
  if (!compensationData?.length) {
    return;
  }

  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);
  await mediaService.deleteMedias(compensationData);
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const createMediasStep = createStep(
  "create-medias-step",
  async (input: CreateMediasStepInput, { container }) => {
    const { output, compensation } = await invokeCreateMedias(input, container);
    return new StepResponse(output, compensation);
  },
  async (compensationData: string[] | undefined, { container }) => {
    await compensateCreateMedias(compensationData, container);
  },
);
