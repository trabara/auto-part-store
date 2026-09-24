import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { deleteOAuthProviderWorkflow } from "../../../../workflows";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  await deleteOAuthProviderWorkflow(req.scope).run({ input: { id } });
  res.status(204).send();
};
