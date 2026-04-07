import type * as z from "@medusajs/framework/zod";
import type { InvoiceConfigSchema, InvoiceStatusEnum } from "../schemas/invoice";

/**
 * InvoiceConfig entity DTO — matches the DML model shape (nullable fields use
 * `string | null` to match what the database returns at runtime).
 */
export type InvoiceConfig = z.infer<typeof InvoiceConfigSchema>

export type CreateInvoiceConfig = {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo?: string;
  notes?: string;
  template: string;
};

export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

// ── Invoice entity DTO ────────────────────────────────────────────────────────

export type Invoice = {
  id: string;
  display_id: number;
  order_id: string;
  status: InvoiceStatus | "latest";
  content: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

// ── Invoice mutation input types ──────────────────────────────────────────────

export type CreateInvoiceInput = {
  order_id: string;
  status?: InvoiceStatus | "latest";
  content?: Record<string, any>;
};

export type UpdateInvoiceInput = {
  id: string;
  status?: InvoiceStatus | "latest";
  content?: Record<string, any>;
};
