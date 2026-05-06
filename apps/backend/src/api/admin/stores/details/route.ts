import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { upsertStoreDetailsWorkflow } from "../../../../workflows/upsert-store-details";
import type { UpsertStoreDetailsSchema } from "./middlewares";

export async function POST(
  req: AuthenticatedMedusaRequest<UpsertStoreDetailsSchema>,
  res: MedusaResponse,
) {
  const { result: storeDetails } = await upsertStoreDetailsWorkflow(
    req.scope,
  ).run({
    input: req.validatedBody,
  });

  res.json({ store_details: storeDetails });
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
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
    return res.json({ store_details: null });
  }

  const thumbnail = (record.entity_media as any[])?.find(
    (m: any) => m.type === "thumbnail",
  );

  res.json({
    store_details: {
      ...record,
      logo_url: thumbnail?.url ?? null,
    },
  });
}
