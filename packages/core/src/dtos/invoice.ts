import type * as z from "@medusajs/framework/zod";
import type {
  InvoiceConfigSchema,
  InvoiceStatusEnum,
} from "../schemas/invoice";

export type InvoiceConfig = z.infer<typeof InvoiceConfigSchema>;

export type PostInvoiceConfig = {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo?: string;
  notes?: string;
  template: string;
};

export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;
