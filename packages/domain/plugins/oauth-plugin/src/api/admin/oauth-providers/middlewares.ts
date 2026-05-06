import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

export const UpsertOAuthProviderSchema = z.object({
  provider: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  callback_url: z.string().url(),
  success_redirect_url: z.string().url(),
  enabled: z.boolean().default(false),
});

export type UpsertOAuthProviderBody = z.infer<typeof UpsertOAuthProviderSchema>;

const authenticateMiddleware = authenticate(["admin"], ["bearer", "session"]);

export const adminOAuthProvidersMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/oauth-providers",
    methods: ["GET"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/oauth-providers",
    methods: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpsertOAuthProviderSchema),
    ],
  },
  {
    matcher: "/admin/oauth-providers/:id",
    methods: ["DELETE"],
    middlewares: [authenticateMiddleware],
  },
];
