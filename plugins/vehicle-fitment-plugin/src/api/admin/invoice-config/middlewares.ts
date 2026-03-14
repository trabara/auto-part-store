import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { PostInvoiceConfigSchema } from "../../../modules/invoice-generator/schema";

export const adminInvoiceMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/admin/invoice-config",
        methods: ["POST"],
        middlewares: [
            validateAndTransformBody(PostInvoiceConfigSchema),
        ],
    },
]