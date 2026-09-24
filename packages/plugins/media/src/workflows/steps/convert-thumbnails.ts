import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE, type MediaModuleService } from "../../modules/media";

export type ConvertEntityThumbnailsStepInput = {
  entity_ids: string[];
};

type ExistingThumbnail = { id: string; [key: string]: any };

// ---------------------------------------------------------------------------
// Named handler functions — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeConvertEntityThumbnails(
  input: ConvertEntityThumbnailsStepInput,
  container: { resolve: (key: string) => any },
): Promise<{ output: ExistingThumbnail[]; compensation: string[] }> {
  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);

  // Find existing thumbnails in the specified entities
  const existingThumbnails = await mediaService.listMedia({
    type: "thumbnail",
    entity_id: input.entity_ids,
  });

  if (existingThumbnails.length === 0) {
    return { output: [], compensation: [] };
  }

  // Store previous states for compensation
  const compensationData: string[] = existingThumbnails.map((t) => t.id);

  // Convert existing thumbnails to "image" type
  await mediaService.updateMedia(
    existingThumbnails.map((t) => ({
      id: t.id,
      type: "image" as const,
    })),
  );

  return {
    output: existingThumbnails as ExistingThumbnail[],
    compensation: compensationData,
  };
}

export async function compensateConvertEntityThumbnails(
  compensationData: string[] | undefined,
  container: { resolve: (key: string) => any },
): Promise<void> {
  if (!compensationData?.length) {
    return;
  }

  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);

  // Revert thumbnails back to "thumbnail" type
  await mediaService.updateMedia(
    compensationData.map((id) => ({
      id,
      type: "thumbnail" as const,
    })),
  );
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const convertEntityThumbnailsStep = createStep(
  "convert-entity-thumbnails-step",
  async (input: ConvertEntityThumbnailsStepInput, { container }) => {
    const { output, compensation } = await invokeConvertEntityThumbnails(
      input,
      container,
    );
    return new StepResponse(output, compensation);
  },
  async (compensationData: string[] | undefined, { container }) => {
    await compensateConvertEntityThumbnails(compensationData, container);
  },
);
