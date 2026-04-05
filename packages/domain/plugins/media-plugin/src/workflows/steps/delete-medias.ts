import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type DeleteMediasStepInput = {
  ids: string[];
};

export const deleteMediasStep = createStep(
  "delete-medias-step",
  async (input: DeleteMediasStepInput, { container }) => {
    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Retrieve the full entity medias data before deleting
    const medias = await mediaService.listMedias({
      id: input.ids,
    });

    // Delete the entity medias
    await mediaService.deleteMedias(input.ids);

    return new StepResponse(
      { success: true, deleted: input.ids },
      medias,
    );
  },
  async (medias, { container }) => {
    if (!medias || medias.length === 0) {
      return;
    }

    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Recreate all entity medias with their original data
    await mediaService.createMedias(
      medias.map((media) => ({
        id: media.id,
        entity_id: media.entity_id,
        type: media.type,
        url: media.url,
        file_id: media.file_id,
      })),
    );
  },
);
