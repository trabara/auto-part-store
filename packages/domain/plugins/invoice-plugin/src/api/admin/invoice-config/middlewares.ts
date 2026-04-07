import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { CreateInvoiceConfigSchema } from "@trabara/core/validations";

export const adminInvoiceMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/invoice-config",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(CreateInvoiceConfigSchema)],
  },
];
