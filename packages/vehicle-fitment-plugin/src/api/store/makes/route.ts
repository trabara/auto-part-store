import { MakeController } from "../../../modules/fitment/controllers/make";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new MakeController(req, res);
    await controller.list();
}