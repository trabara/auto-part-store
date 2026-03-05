import { EngineController } from "@/modules/fitment/controllers/engine";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new EngineController(req, res);
    await controller.list();
}