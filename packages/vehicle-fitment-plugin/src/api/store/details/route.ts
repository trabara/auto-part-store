import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "store",
    fields: ["id", "name", "store_details.*"],
  });

  const store = data[0];

  if (!store) {
    return res.status(404).json({ message: "Store not found" });
  }

  const details = (store as any).store_details;

  return res.json({
    store: {
      id: store.id,
      name: store.name,
      logo_url: details?.logo_url ?? null,
      map_url: details?.map_url ?? null,
      address: details?.address ?? null,
      contact_emails: details?.contact_emails ?? null,
      contact_phone_numbers: details?.contact_phone_numbers ?? null,
      social_links: details?.social_links ?? null,
    },
  });
};
