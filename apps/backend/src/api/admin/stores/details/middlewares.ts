import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

export const UpsertStoreDetailsSchema = z.object({
  name: z.string().optional(),
  map_url: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contact_emails: z.array(z.string().email()).nullable().optional(),
  contact_phone_numbers: z.array(z.string()).nullable().optional(),
  social_links: z.record(z.string(), z.string()).nullable().optional(),
});

export type UpsertStoreDetailsSchema = z.infer<typeof UpsertStoreDetailsSchema>;

export const adminStoreDetailsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/stores/details",
    method: ["POST"],
    middlewares: [validateAndTransformBody(UpsertStoreDetailsSchema)],
  },
];
