import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MediaController } from "../../../../_controllers/media";

/**
 * POST /admin/medias/:entity_id/images
 * Create a batch of images for a specific media entity
 */
export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.createBatch();

}

/**
 * GET /admin/medias/:entity_id/images
 * List all images for a specific media entity
 */
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.list();
}