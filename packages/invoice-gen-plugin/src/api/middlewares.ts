import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { CreateInvoiceConfigSchema } from "../modules/invoice-gen/dtos";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(CreateInvoiceConfigSchema as any)],
    },
  ],
});
