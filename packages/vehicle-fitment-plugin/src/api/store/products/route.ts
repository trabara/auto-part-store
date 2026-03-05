import { ProductController } from "@/modules/fitment/controllers/product";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const controller = new ProductController(req, res);
    await controller.list();
}