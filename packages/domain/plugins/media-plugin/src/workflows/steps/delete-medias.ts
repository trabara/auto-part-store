import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type DeleteMediasStepInput = {
  ids: string[];
};

type SavedMedia = {
  id: string;
  entity_id: string;
  type: "thumbnail" | "image";
  url: string;
  file_id: string;
};

// ---------------------------------------------------------------------------
// Named handler functions — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeDeleteMedias(
  input: DeleteMediasStepInput,
  container: { resolve: (key: string) => any },
): Promise<{
  output: { success: true; deleted: string[] };
  compensation: SavedMedia[];
}> {
  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);

  // Retrieve the full entity medias data before deleting
  const medias = await mediaService.list({ id: input.ids });

  // Delete the entity medias
  await mediaService.delete(input.ids);

  return {
    output: { success: true, deleted: input.ids },
    compensation: medias as SavedMedia[],
  };
}

export async function compensateDeleteMedias(
  compensationData: SavedMedia[] | undefined,
  container: { resolve: (key: string) => any },
): Promise<void> {
  if (!compensationData || compensationData.length === 0) {
    return;
  }

  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);

  // Recreate all entity medias with their original data
  await mediaService.create(
    compensationData.map((media) => ({
      id: media.id,
      entity_id: media.entity_id,
      type: media.type,
      url: media.url,
      file_id: media.file_id,
    })),
  );
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const deleteMediasStep = createStep(
  "delete-medias-step",
  async (input: DeleteMediasStepInput, { container }) => {
    const { output, compensation } = await invokeDeleteMedias(input, container);
    return new StepResponse(output, compensation);
  },
  async (compensationData: SavedMedia[] | undefined, { container }) => {
    await compensateDeleteMedias(compensationData, container);
  },
);
