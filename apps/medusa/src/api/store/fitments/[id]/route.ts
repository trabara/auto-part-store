import { FitmentsController } from "@/modules/fitment/controllers/fitments";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new FitmentsController(req, res);
    await controller.getById();
}