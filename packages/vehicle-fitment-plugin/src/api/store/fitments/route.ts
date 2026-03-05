import { FitmentController } from "@/modules/fitment/controllers/fitment";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new FitmentController(req, res);
    await controller.list();
}