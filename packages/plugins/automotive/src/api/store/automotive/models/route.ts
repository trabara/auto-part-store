import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { params, required, vehicleService } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  res.json({ models: await vehicleService(req).selectorModels(required(params(req).make_id, "make_id")) });
}
