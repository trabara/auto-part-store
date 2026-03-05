import { Module } from "@medusajs/framework/utils";
import createDefaultConfigLoader from "./loaders/create-default-config";
import { InvoiceGeneratorService } from "./service";

export const INVOICE_MODULE = "invoiceGenerator";

export default Module(INVOICE_MODULE, {
  service: InvoiceGeneratorService,
  loaders: [createDefaultConfigLoader],
});

export * from './service';
