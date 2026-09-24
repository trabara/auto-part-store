import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { CreateInvoiceConfigSchema } from "@repo/core/validations";

export const adminInvoiceMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/invoice-config",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(CreateInvoiceConfigSchema)],
  },
];
