import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import MediaModuleService from "@repo/domain-modules/media/service";

export type ListMediasStepInput = {
  filters: Record<string, any>;
  fields?: string[];
};

// ---------------------------------------------------------------------------
// Named handler function — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeListMedias(
  input: ListMediasStepInput,
  container: { resolve: (key: string) => any },
): Promise<any[]> {
  const mediaService: MediaModuleService =
    container.resolve(ENTITY_MEDIA_MODULE);
  return mediaService.listMedias(input.filters);
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const listMediasStep = createStep(
  "list-medias-step",
  async (input: ListMediasStepInput, { container }) => {
    const medias = await invokeListMedias(input, container);
    return new StepResponse(medias);
  },
);
