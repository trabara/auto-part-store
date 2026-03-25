import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MakeController } from "../../controllers/make";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new MakeController(req, res);
    await controller.list();
}