import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MediaController } from "../../../../../controllers/media";

export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.updateBatch();
}

export async function DELETE(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.deleteBatch();
}