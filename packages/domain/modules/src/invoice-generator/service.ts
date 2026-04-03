import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import axios from "axios";
import Handlebars from "handlebars";
import { Browser, chromium } from "playwright";
import { getTranslations } from "./i18n";
import { Invoice } from "./models/invoice";
import { InvoiceConfig } from "./models/invoice-config";
import type { IInvoiceGeneratorModuleService } from "@trabara/core/interfaces";

type InvoiceType = InferTypeOf<typeof Invoice>;
type InvoiceConfigType = InferTypeOf<typeof InvoiceConfig>;

type GeneratePdfParams = {
  order: any;
  items: any[];
  invoice_id: string;
  locale?: string;
};

type InjectedDependencies = {
  invoiceRepository: DAL.RepositoryService<InvoiceType>;
  invoiceConfigRepository: DAL.RepositoryService<InvoiceConfigType>;
  baseRepository: DAL.RepositoryService<any>;
};

class InvoiceGeneratorService implements IInvoiceGeneratorModuleService {
  protected invoiceRepository_: DAL.RepositoryService<InvoiceType>;
  protected invoiceConfigRepository_: DAL.RepositoryService<InvoiceConfigType>;
  protected baseRepository_: DAL.RepositoryService<any>;
  private browser: Browser | null = null;

  constructor(dependencies: InjectedDependencies) {
    this.invoiceRepository_ = dependencies.invoiceRepository;
    this.invoiceConfigRepository_ = dependencies.invoiceConfigRepository;
    this.baseRepository_ = dependencies.baseRepository;
  }

  // ============================================================================
  // Invoice CRUD
  // ============================================================================

  @InjectManager()
  async listInvoices(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceType[]> {
    return this.listInvoices_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listInvoices_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceType[]> {
    return this.invoiceRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountInvoices(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[InvoiceType[], number]> {
    return this.listAndCountInvoices_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountInvoices_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[InvoiceType[], number]> {
    const results = await this.invoiceRepository_.find(
      { where: filters ?? {} },
      ctx,
    );
    return [results, results.length];
  }

  @InjectManager()
  async retrieveInvoice(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceType> {
    return this.retrieveInvoice_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveInvoice_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceType> {
    const [invoice] = await this.invoiceRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!invoice) throw new Error(`Invoice with id ${id} not found`);
    return invoice;
  }

  @InjectManager()
  async createInvoices(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceType[]> {
    return this.createInvoices_(data, ctx);
  }

  @InjectTransactionManager()
  private async createInvoices_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceType[]> {
    return this.invoiceRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateInvoices(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    return this.updateInvoices_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateInvoices_(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    const arr = Array.isArray(data) ? data : [data];
    const result = await this.invoiceRepository_.update(arr, ctx);
    return Array.isArray(data) ? result : result[0];
  }

  @InjectManager()
  async deleteInvoices(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteInvoices_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteInvoices_(
    ids: string | string[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    const arr = Array.isArray(ids) ? ids : [ids];
    await this.invoiceRepository_.delete({ id: { $in: arr } }, ctx);
  }

  // ============================================================================
  // InvoiceConfig CRUD
  // ============================================================================

  @InjectManager()
  async listInvoiceConfigs(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType[]> {
    return this.listInvoiceConfigs_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listInvoiceConfigs_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType[]> {
    return this.invoiceConfigRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountInvoiceConfigs(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[InvoiceConfigType[], number]> {
    return this.listAndCountInvoiceConfigs_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountInvoiceConfigs_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[InvoiceConfigType[], number]> {
    const results = await this.invoiceConfigRepository_.find(
      { where: filters ?? {} },
      ctx,
    );
    return [results, results.length];
  }

  @InjectManager()
  async retrieveInvoiceConfig(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType> {
    return this.retrieveInvoiceConfig_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveInvoiceConfig_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType> {
    const [config_] = await this.invoiceConfigRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!config_) throw new Error(`InvoiceConfig with id ${id} not found`);
    return config_;
  }

  @InjectManager()
  async createInvoiceConfigs(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType[]> {
    return this.createInvoiceConfigs_(data, ctx);
  }

  @InjectTransactionManager()
  private async createInvoiceConfigs_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType[]> {
    return this.invoiceConfigRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateInvoiceConfigs(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType[]> {
    return this.updateInvoiceConfigs_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateInvoiceConfigs_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<InvoiceConfigType[]> {
    return this.invoiceConfigRepository_.update(data, ctx);
  }

  // ============================================================================
  // PDF generation
  // ============================================================================

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    return this.browser;
  }

  private formatPrice(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  async createPdfContent(
    params: GeneratePdfParams,
    invoice: InvoiceType,
  ): Promise<Buffer> {
    const invoiceConfigs = await this.listInvoiceConfigs();
    const invoiceConfig = (invoiceConfigs[0] ?? {}) as any;

    const lineItems = params.items.map((item: any) => {
      const unitPriceVal = Number(item.unit_price);
      const totalVal = Number(item.total);

      return {
        description: item.product_title || item.title || "Product",
        quantity: item.quantity,
        unitPrice: this.formatPrice(unitPriceVal),
        total: this.formatPrice(totalVal),
        sku: item.variant_sku,
      };
    });

    const subtotal = params.items.reduce(
      (sum: number, item: any) => sum + Number(item.subtotal),
      0,
    );
    const tax = params.items.reduce(
      (sum: number, item: any) => sum + Number(item.tax_total),
      0,
    );
    const shipping = Number(params.order.shipping_total) || 0;
    const total = Number(params.order.total);

    const shippingAddress = params.order.shipping_address as any;
    const billingAddress = params.order.billing_address as any;

    const firstName =
      shippingAddress?.first_name || billingAddress?.first_name || "";
    const lastName =
      shippingAddress?.last_name || billingAddress?.last_name || "";
    const customerName =
      firstName && lastName ? `${firstName} ${lastName}` : "Customer";
    const compamyLogo = invoiceConfig?.company_logo
      ? await this.imageUrlToBase64(invoiceConfig.company_logo).catch(
          () => undefined,
        )
      : invoiceConfig?.company_name;

    const templateData = {
      companyName: invoiceConfig?.company_name,
      companyAddress: invoiceConfig?.company_address,
      companyPhone: invoiceConfig?.company_phone,
      companyEmail: invoiceConfig?.company_email,
      companyLogo: compamyLogo,
      invoiceNumber: String((invoice as any)?.display_id || "0001").padStart(
        4,
        "0",
      ),
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(),
      customerName,
      customerAddress:
        shippingAddress?.address_1 || billingAddress?.address_1 || "",
      customerCity: shippingAddress?.city || billingAddress?.city || "",
      customerCountry:
        shippingAddress?.country_code || billingAddress?.country_code || "",
      customerPhone: shippingAddress?.phone || billingAddress?.phone,
      customerEmail: shippingAddress?.email || billingAddress?.email,
      lineItems,
      subtotal: this.formatPrice(subtotal),
      taxRate: "19",
      taxAmount: this.formatPrice(tax),
      shipping: this.formatPrice(shipping),
      total: this.formatPrice(total),
      currency: params.order.currency_code?.toUpperCase() || "TND",
      notes: invoiceConfig?.notes,
      dir: params.locale === "ar" ? "rtl" : "ltr",
      isRtl: params.locale === "ar",
      t: getTranslations(params.locale || "en"),
    };

    const template = Handlebars.compile(invoiceConfig.template);
    const html = template(templateData);
    const browser = await this.getBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await page.close();

    return Buffer.from(pdfBuffer);
  }

  async generatePdf(params: GeneratePdfParams): Promise<Buffer> {
    const invoices = await this.listInvoices({
      order_id: params.order.id,
      status: "latest",
    });

    const locale = params.locale || "en";
    const invoice = invoices[0] as any;
    if (!invoice.content) {
      invoice.content = {};
    }
    invoice.content[locale] =
      invoice.content[locale] ??
      (await this.createPdfContent(params, invoice).then((content) =>
        content.toString("base64"),
      ));

    await this.updateInvoices(invoice);

    return Buffer.from(String(invoice.content[locale]), "base64");
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async imageUrlToBase64(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data).toString("base64");
    const mimeType = response.headers["content-type"] || "image/png";
    return `data:${mimeType};base64,${base64}`;
  }
}

export default InvoiceGeneratorService;
