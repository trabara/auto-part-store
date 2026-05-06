import {
  Module
} from "@medusajs/framework/utils";
import InvoiceGeneratorService from "./service";

export const INVOICE_MODULE = "invoiceGenerator";

export { InvoiceStatus } from "./models/invoice";

export default Module(INVOICE_MODULE, {
  service: InvoiceGeneratorService,
  // loaders: [setupInvoicePermissionsLoader],
});
