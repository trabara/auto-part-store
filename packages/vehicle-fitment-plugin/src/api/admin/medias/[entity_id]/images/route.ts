import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MediaController } from "../../../../controllers/media";


export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.createBatch();

}

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new MediaController(req, res);
    await controller.list();
}