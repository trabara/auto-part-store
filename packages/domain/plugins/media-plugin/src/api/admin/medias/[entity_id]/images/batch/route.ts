import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MediaController } from "../../../../../_controllers/media";

export async function POST(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.updateBatch();
}

export async function DELETE(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.deleteBatch();
}