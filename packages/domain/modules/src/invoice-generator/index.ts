import { Module } from "@medusajs/framework/utils";
import InvoiceGeneratorService from "./service";
import { Invoice } from "./models/invoice";
import { InvoiceConfig } from "./models/invoice-config";

export const INVOICE_MODULE = "invoiceGenerator";

export { InvoiceStatus } from "./models/invoice";

// Register DML models on the service so Module() can build linkable keys
const _modelObjectsSymbol = Symbol.for("MedusaServiceModelObjectsSymbol");
(InvoiceGeneratorService as any)[_modelObjectsSymbol] = {
  Invoice,
  InvoiceConfig,
};

export default Module(INVOICE_MODULE, {
  service: InvoiceGeneratorService,
});
