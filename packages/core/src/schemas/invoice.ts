import { z } from "@medusajs/framework/zod";
import { BASE_MASK, BaseSchema } from "./base";

export const InvoiceStatusEnum = z.enum(["active", "stale", "failed"]);

export const InvoiceConfigSchema = BaseSchema.extend({
  company_name: z.string().min(1, "Company name is required"),
  company_address: z.string().min(1, "Company address is required"),
  company_phone: z.string().min(1, "Company phone is required"),
  company_email: z.string().email("Invalid email address"),
  company_logo: z.string().optional(),
  notes: z.string().optional(),
  template: z.string(),
});

export const InvoiceSchema = BaseSchema.extend({
  invoice_number: z.string().min(1, "Invoice number is required"),
  order_id: z.string().min(1, "Order ID is required"),
  status: InvoiceStatusEnum,
  config: InvoiceConfigSchema,
});