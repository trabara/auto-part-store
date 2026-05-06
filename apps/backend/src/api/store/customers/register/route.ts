import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { IAuthModuleService } from "@medusajs/framework/types";
import { generateJwtToken } from "@medusajs/utils";
import { registerCustomerWorkflow } from "../../../../workflows/register-customer";
import type { RegisterCustomerBody } from "./middlewares";

export async function POST(
  req: MedusaRequest<RegisterCustomerBody>,
  res: MedusaResponse,
) {
  const { email, password, first_name, last_name, phone } = req.validatedBody;

  const authModule = req.scope.resolve<IAuthModuleService>(Modules.AUTH);

  // Remove any orphaned identity left by a previous failed attempt so that
  // authModule.register doesn't throw "Identity already exists".
  const [orphaned] = await authModule.listAuthIdentities(
    { provider_identities: { entity_id: email, provider: "emailpass" } },
    { relations: ["provider_identities"] },
  );

  if (orphaned && !orphaned.app_metadata?.customer_id) {
    await authModule.deleteAuthIdentities([orphaned.id]);
  }

  // Create the auth identity (hashes the password via the emailpass provider).
  const { success, authIdentity, error } = await authModule.register(
    "emailpass",
    {
      url: req.url,
      headers: req.headers as Record<string, string>,
      query: req.query as Record<string, string>,
      body: { email, password },
      protocol: req.protocol,
    },
  );

  if (!success || !authIdentity) {
    res.status(401).json({ message: error ?? "Registration failed" });
    return;
  }

  // Create or link the customer and activate the account.
  const { result: customer } = await registerCustomerWorkflow(req.scope).run({
    input: {
      email,
      auth_identity_id: authIdentity.id,
      first_name,
      last_name,
      phone,
    },
  });

  // Generate a JWT for the newly registered customer.
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);
  const { http } = config.projectConfig;

  const token = generateJwtToken(
    {
      actor_id: (customer as any).id,
      actor_type: "customer",
      auth_identity_id: authIdentity.id,
      app_metadata: { customer_id: (customer as any).id },
    },
    {
      secret: http.jwtSecret as string,
      expiresIn: http.jwtExpiresIn ?? "1d",
    },
  );

  return res.status(200).json({ token, customer });
}
