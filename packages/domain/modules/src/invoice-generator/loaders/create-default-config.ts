import { LoaderOptions } from "@medusajs/framework/types";
import { DEFAULT_INVOICE_TEMPLATE } from "../contants";
import type InvoiceGeneratorService from "../service";
const INVOICE_MODULE = "invoiceGenerator";

export default async function createDefaultConfigLoader({
  container,
}: LoaderOptions) {
  const service: InvoiceGeneratorService = container.resolve(INVOICE_MODULE);

  const [_, count] = await service.listAndCountInvoiceConfigs();

  if (count > 0) {
    return;
  }

  await service.createInvoiceConfigs([
    {
      company_name: "Acme",
      company_address: "123 Acme St, Springfield, USA",
      company_phone: "+1 234 567 8900",
      company_email: "admin@example.com",
      template: DEFAULT_INVOICE_TEMPLATE,
    },
  ]);
}
