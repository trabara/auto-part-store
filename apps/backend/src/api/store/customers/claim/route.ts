import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { claimCustomerAccountWorkflow } from "../../../../workflows/claim-customer-account";
import type { ClaimCustomerBody } from "./middlewares";

export async function POST(
  req: AuthenticatedMedusaRequest<ClaimCustomerBody>,
  res: MedusaResponse,
) {
  const { email, first_name, last_name, phone } = req.validatedBody;
  const auth_identity_id = req.auth_context.auth_identity_id;

  const { result } = await claimCustomerAccountWorkflow(req.scope).run({
    input: {
      auth_identity_id,
      email,
      first_name,
      last_name,
      phone,
    },
  });

  return res.status(200).json({ customer: result });
}
