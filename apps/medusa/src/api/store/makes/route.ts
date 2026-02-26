import { MakesController } from "@/modules/fitment/controllers/makes";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new MakesController(req, res);
    await controller.list();
}