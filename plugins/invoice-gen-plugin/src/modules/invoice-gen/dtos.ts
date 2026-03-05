import { OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types";
import z from "zod";

const BaseSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const InvoiceConfigDTOSchema = BaseSchema.extend({
  company_name: z.string(),
  company_address: z.string(),
  company_phone: z.string(),
  company_email: z.string(),
  company_logo: z.string().optional(),
  notes: z.string().optional(),
  template_id: z.string().default("default"),
});

export type InvoiceConfigDTO = z.infer<typeof InvoiceConfigDTOSchema>;

export const CreateInvoiceConfigSchema = InvoiceConfigDTOSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export type CreateInvoiceConfigDTO = z.infer<typeof CreateInvoiceConfigSchema>;

export type GenerateInvoicePdfStepInput = {
  order: OrderDTO;
  items: OrderLineItemDTO[];
  invoice_id: string;
};
