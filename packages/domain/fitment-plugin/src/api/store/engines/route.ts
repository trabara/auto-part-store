import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { EngineController } from "../../_controllers/engine";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new EngineController(req, res);
    await controller.list();
}