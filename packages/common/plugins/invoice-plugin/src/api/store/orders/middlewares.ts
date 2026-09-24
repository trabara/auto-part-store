import { MiddlewareRoute } from "@medusajs/framework";

export const storeOrdersMiddlewares: MiddlewareRoute[] = [
    {
        matcher: '/store/orders/:id/invoices',
        methods: ["GET"],
    }
]