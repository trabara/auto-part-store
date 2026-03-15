import { defineRouteConfig } from "@medusajs/admin-sdk";
import { InvoiceGenerator } from "../../../modules/invoice-generator";

const InvoiceConfigPage = () => {
  return <InvoiceGenerator />
};

export const config = defineRouteConfig({
  label: "invoice.page.title",
  translationNs: "invoice",
});

export default InvoiceConfigPage;
