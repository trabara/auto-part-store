import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { selectorParams as params, required, vehicleService } from "../../../request";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  res.json({ models: await vehicleService(req).selectorModels(required(params(req).make_id, "make_id")) });
}
