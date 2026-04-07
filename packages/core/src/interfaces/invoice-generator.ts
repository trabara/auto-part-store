import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type { IBaseModuleService } from "./base-module-service";

export interface IInvoiceGeneratorModuleService extends IBaseModuleService<any> {
  // InvoiceConfig CRUD (stays manual — separate repo)
  listInvoiceConfigs(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  listAndCountInvoiceConfigs(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[any[], number]>;

  retrieveInvoiceConfig(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createInvoiceConfigs(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateInvoiceConfigs(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  // PDF generation
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
    invoice: any,
  ): Promise<Buffer>;

  imageUrlToBase64(url: string): Promise<string>;

  close(): Promise<void>;
}
