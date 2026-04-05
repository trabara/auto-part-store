import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type UpdateMediasStepInput = {
  updates: {
    id: string;
    type?: "thumbnail" | "image";
  }[];
};

export const updateMediasStep = createStep(
  "update-medias-step",
  async (input: UpdateMediasStepInput, { container }) => {
    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Get previous data for the medias being updated
    const prevData = await mediaService.listMedias({
      id: input.updates.map((u) => u.id),
    });

    // Apply the requested updates
    const updatedData = await mediaService.updateMedias(
      input.updates,
    );

    return new StepResponse(updatedData, prevData);
  },
  async (compensationData, { container }) => {
    if (!compensationData?.length) {
      return;
    }

    const mediaService: MediaModuleService =
      container.resolve(ENTITY_MEDIA_MODULE);

    // Revert all updates
    await mediaService.updateMedias(
      compensationData.map((img) => ({
        id: img.id,
        type: img.type,
      })),
    );
  },
);
