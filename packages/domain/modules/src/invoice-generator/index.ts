import { MedusaServiceModelObjectsSymbol, Module } from "@medusajs/framework/utils";
import createDefaultConfigLoader from "./loaders/create-default-config";
import { Invoice } from "./models/invoice";
import { InvoiceConfig } from "./models/invoice-config";
import InvoiceGeneratorService from "./service";

export const INVOICE_MODULE = "invoiceGenerator";

export { InvoiceStatus } from "./models/invoice";

InvoiceGeneratorService[MedusaServiceModelObjectsSymbol] = {
  Invoice,
  InvoiceConfig,
};

export default Module(INVOICE_MODULE, {
  service: InvoiceGeneratorService,
  // loaders: [createDefaultConfigLoader]
});
