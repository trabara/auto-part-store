import { z } from "@medusajs/framework/zod";
import { BaseSchema } from "./base";

export const InvoiceStatusEnum = z.enum(["active", "stale", "failed"]).describe("The status of the invoice");

export const InvoiceConfigSchema = BaseSchema.extend({
  company_name: z.string().min(1, "Company name is required").describe("The name of the company to display on invoices"),
  company_address: z.string().min(1, "Company address is required").describe("The address of the company to display on invoices"),
  company_phone: z.string().min(1, "Company phone is required").describe("The phone number of the company to display on invoices"),
  company_email: z.string().email("Invalid email address").describe("The email address of the company to display on invoices"),
  company_logo: z.string().optional().describe("The logo of the company to display on invoices"),
  notes: z.string().optional().describe("Additional notes to display on invoices"),
  template: z.string().describe("The template used for generating invoices"),
});

export const InvoiceSchema = BaseSchema.extend({
  invoice_number: z.string().min(1, "Invoice number is required").describe("The unique identifier for the invoice"),
  order_id: z.string().min(1, "Order ID is required").describe("The unique identifier for the order associated with the invoice"),
  status: InvoiceStatusEnum.describe("The current status of the invoice"),
  config: InvoiceConfigSchema.describe("The configuration settings for the invoice"),
});