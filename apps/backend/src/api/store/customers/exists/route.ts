import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import type {
  IAuthModuleService,
  ICustomerModuleService,
} from "@medusajs/framework/types";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { email } = req.validatedQuery as { email: string };

  const customerModule = req.scope.resolve<ICustomerModuleService>(
    Modules.CUSTOMER,
  );

  const [customer] = await customerModule.listCustomers({ email });

  if (!customer) {
    return res.json({ status: "none" });
  }

  if (customer.has_account) {
    return res.json({ status: "registered" });
  }

  // Guest customer — clean up any orphaned emailpass auth identity left by a
  // previous partial registration attempt (sdk.auth.register succeeded but the
  // claim step failed).  Deleting it here ensures the upcoming sdk.auth.register
  // call on the storefront won't hit the "Identity already exists" error.
  const authModule = req.scope.resolve<IAuthModuleService>(Modules.AUTH);

  const [orphaned] = await authModule.listAuthIdentities(
    { provider_identities: { entity_id: email, provider: "emailpass" } },
    { relations: ["provider_identities"] },
  );

  if (orphaned && !orphaned.app_metadata?.customer_id) {
    await authModule.deleteAuthIdentities([orphaned.id]);
  }

  return res.json({
    status: "guest",
    first_name: customer.first_name ?? undefined,
    last_name: customer.last_name ?? undefined,
  });
}
