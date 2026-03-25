import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { FitmentController } from "../../../_controllers/fitment";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new FitmentController(req, res);
    await controller.getById();
}