import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type UpdateMediasStepInput = {
  updates: {
    id: string;
    type?: "thumbnail" | "image";
  }[];
};

type PrevMedia = { id: string; type: "thumbnail" | "image" };

// ---------------------------------------------------------------------------
// Named handler functions — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeUpdateMedias(
  input: UpdateMediasStepInput,
  container: { resolve: (key: string) => any },
): Promise<{ output: any; compensation: PrevMedia[] }> {
  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);

  // Get previous data for the medias being updated
  const prevData = await mediaService.listMedias({
    id: input.updates.map((u) => u.id),
  });

  // Apply the requested updates
  const updatedData = await mediaService.updateMedias(input.updates);

  return { output: updatedData, compensation: prevData as PrevMedia[] };
}

export async function compensateUpdateMedias(
  compensationData: PrevMedia[] | undefined,
  container: { resolve: (key: string) => any },
): Promise<void> {
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
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const updateMediasStep = createStep(
  "update-medias-step",
  async (input: UpdateMediasStepInput, { container }) => {
    const { output, compensation } = await invokeUpdateMedias(input, container);
    return new StepResponse(output, compensation);
  },
  async (compensationData: PrevMedia[] | undefined, { container }) => {
    await compensateUpdateMedias(compensationData, container);
  },
);
