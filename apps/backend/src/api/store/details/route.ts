import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");

  const { data } = await query.graph({
    entity: "store_details",
    fields: [
      "id",
      "name",
      "map_url",
      "address",
      "contact_emails",
      "contact_phone_numbers",
      "social_links",
      "entity_media.*",
    ],
  });

  const record = data[0] ?? null;

  if (!record) {
    return res.json({ store: null });
  }

  const thumbnail = (record.entity_media as any[])?.find(
    (m: any) => m.type === "thumbnail",
  );

  res.json({
    store: {
      id: record.id,
      name: record.name,
      map_url: record.map_url,
      address: record.address,
      contact_emails: record.contact_emails,
      contact_phone_numbers: record.contact_phone_numbers,
      social_links: record.social_links,
      logo_url: thumbnail?.url ?? null,
    },
  });
}
