import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ProductController } from "../../../../../_controllers";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const controller = new ProductController(req, res);
  await controller.unlinkFitmentFromProduct();
};
