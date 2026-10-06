import type { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { models, params, required } from "../selector";

export async function GET(req: MedusaStoreRequest<unknown>, res: MedusaResponse) {
  res.json({ models: await models(req, required(params(req).make_id, "make_id")) });
}
