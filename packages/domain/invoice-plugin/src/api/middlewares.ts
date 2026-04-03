import { defineMiddlewares } from "@medusajs/framework";

import { adminInvoiceMiddlewares } from "./admin/invoice-config/middlewares";
import { storeOrdersMiddlewares } from "./store/orders/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminInvoiceMiddlewares,
    ...storeOrdersMiddlewares,
  ],
});
