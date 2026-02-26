import { EnginesController } from "@/modules/fitment/controllers/engines";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new EnginesController(req, res);
    await controller.list();
}