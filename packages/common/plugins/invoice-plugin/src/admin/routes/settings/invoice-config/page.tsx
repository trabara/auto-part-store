import { defineRouteConfig } from "@medusajs/admin-sdk";
import { InvoiceGeneratorForm } from "./components/invoice-gen-form";

const InvoiceConfigPage = () => {
  return <InvoiceGeneratorForm />;
};

export const config = defineRouteConfig({
  label: "invoice.page.title",
  translationNs: "invoice",
});

export default InvoiceConfigPage;
