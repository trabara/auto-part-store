import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CreateMediasInput } from "@repo/core";
import {
  ENTITY_MEDIA_MODULE,
  type MediaModuleService,
} from "../../../../../modules/media";
import { createMediasWorkflow } from "../../../../../workflows";

/**
 * POST /admin/medias/:entity_id/images
 * Create a batch of images for a specific media entity
 */
export async function POST(
  req: MedusaRequest<CreateMediasInput>,
  res: MedusaResponse,
) {
  const { entity_id } = req.params;
  const { files } = req.validatedBody;
  // Add entity_id to each file
  const entity_files = files.map((file) => ({
    ...file,
    entity_id: entity_id,
  }));

  const { result } = await createMediasWorkflow(req.scope).run({
    input: {
      medias: entity_files,
    },
  });
  res.status(200).json({ medias: result });
}

/**
 * GET /admin/medias/:entity_id/images
 * List all images for a specific media entity
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { entity_id } = req.params;
  const mediaService =
    req.scope.resolve<MediaModuleService>(ENTITY_MEDIA_MODULE);

  const medias = await mediaService.listMedia({ entity_id });

  res.status(200).json({ medias });
}
