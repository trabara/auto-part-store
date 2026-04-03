import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { PostInvoiceConfigSchema } from "@trabara/core/validations";

export const adminInvoiceMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/invoice-config",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(PostInvoiceConfigSchema)],
  },
];
