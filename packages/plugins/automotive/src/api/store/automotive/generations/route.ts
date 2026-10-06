import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { params, required, vehicleService } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { model_id, year } = params(req);
  res.json({ generations: await vehicleService(req).selectorGenerations(required(model_id, "model_id"), year) });
}
