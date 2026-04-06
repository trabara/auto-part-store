import { MedusaContainer } from "@medusajs/framework/types";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import type { MediaModuleService } from "@repo/domain-modules/media";

export type TestMedia = {
  id: string;
  entity_id: string;
  type: "thumbnail" | "image";
  url: string;
  file_id: string;
};

export async function createTestMedia(
  container: MedusaContainer,
  entityId: string,
  overrides?: {
    type?: "thumbnail" | "image";
    url?: string;
    file_id?: string;
  },
): Promise<TestMedia> {
  const mediaService = container.resolve(
    ENTITY_MEDIA_MODULE,
  ) as MediaModuleService;

  const [created] = await mediaService.createMedias([
    {
      entity_id: entityId,
      type: overrides?.type ?? "image",
      url: overrides?.url ?? "https://example.com/test-image.jpg",
      file_id: overrides?.file_id ?? `file_${Date.now()}`,
    },
  ]);

  return created as TestMedia;
}

export async function createTestMediaBatch(
  container: MedusaContainer,
  entityId: string,
  count: number,
): Promise<TestMedia[]> {
  const mediaService = container.resolve(
    ENTITY_MEDIA_MODULE,
  ) as MediaModuleService;

  const created = await mediaService.createMedias(
    Array.from({ length: count }, (_, i) => ({
      entity_id: entityId,
      type: "image" as const,
      url: `https://example.com/test-image-${i}.jpg`,
      file_id: `file_${Date.now()}_${i}`,
    })),
  );

  return created as TestMedia[];
}
