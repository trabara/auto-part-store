import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type {
  Invoice,
  InvoiceConfig,
  CreateInvoiceConfig,
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from "../dtos";
import type { IBaseModuleService } from "./base-module-service";

export interface IInvoiceGeneratorModuleService extends IBaseModuleService<Invoice> {
  create(
    data: CreateInvoiceInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<Invoice[]>;

  update(
    data: UpdateInvoiceInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<Invoice[]>;

  // Remote Query joiner delegates (entity name: "invoice")
  listInvoices(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<Invoice[]>;

  listAndCountInvoices(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[Invoice[], number]>;

  // InvoiceConfig CRUD (stays manual — separate repo)
  listInvoiceConfigs(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<InvoiceConfig[]>;

  listAndCountInvoiceConfigs(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[InvoiceConfig[], number]>;

  retrieveInvoiceConfig(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<InvoiceConfig>;

  createInvoiceConfigs(
    data: CreateInvoiceConfig[],
    sharedContext?: Context<EntityManager>,
  ): Promise<InvoiceConfig[]>;

  updateInvoiceConfigs(
    data: (Partial<CreateInvoiceConfig> & { id: string })[],
    sharedContext?: Context<EntityManager>,
  ): Promise<InvoiceConfig[]>;

  // PDF generation — order/items kept as `any` (no order DTO in core)
  generatePdf(params: {
    order: any;
    items: any[];
    invoice_id: string;
    locale?: string;
  }): Promise<Buffer>;

  createPdfContent(
    params: {
      order: any;
      items: any[];
      invoice_id: string;
      locale?: string;
    },
    invoice: Invoice,
  ): Promise<Buffer>;

  imageUrlToBase64(url: string): Promise<string>;

  close(): Promise<void>;
}
