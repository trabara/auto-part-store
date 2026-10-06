import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { generations, params, required } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  const { model_id, year } = params(req);
  res.json({ generations: await generations(req, required(model_id, "model_id"), year) });
}
