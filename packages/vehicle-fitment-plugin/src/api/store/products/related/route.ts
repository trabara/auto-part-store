import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ProductController } from "../../../controllers/product";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new ProductController(req, res);
  await controller.related();
};
