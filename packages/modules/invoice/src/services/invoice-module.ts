import { InferTypeOf, OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types";
import { MedusaService } from "@medusajs/framework/utils";
import axios from "axios";
import Handlebars from "handlebars";
import { Browser, chromium } from "playwright";
import { getTranslations } from "../i18n";
import { Invoice } from "../models";
import { InvoiceConfig } from "../models/invoice-config";

type GeneratePdfParams = {
  order: OrderDTO;
  items: OrderLineItemDTO[];
  invoice_id: string;
  locale?: string;
};


export class InvoiceModuleService extends MedusaService({
  InvoiceConfig,
  Invoice,
}) {
  private browser: Browser | null = null;

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

  async createPdfContent(params: GeneratePdfParams, invoice: InferTypeOf<typeof Invoice>): Promise<Buffer> {
    const invoiceConfigs = await this.listInvoiceConfigs()
    const invoiceConfig = invoiceConfigs[0] || {}

    const lineItems = params.items.map((item) => {
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
      (sum, item) => sum + Number(item.subtotal),
      0,
    );
    const tax = params.items.reduce(
      (sum, item) => sum + Number(item.tax_total),
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
      ? await this.imageUrlToBase64(invoiceConfig.company_logo).catch(() => undefined)
      : invoiceConfig?.company_name;

    const templateData = {
      companyName: invoiceConfig?.company_name,
      companyAddress: invoiceConfig?.company_address,
      companyPhone: invoiceConfig?.company_phone,
      companyEmail: invoiceConfig?.company_email,
      companyLogo: compamyLogo,
      invoiceNumber: String(invoice?.display_id || "0001").padStart(4, "0"),
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
  async generatePdf(params: GeneratePdfParams): Promise<Buffer<ArrayBufferLike>> {
    const invoices = await this.listInvoices({
      order_id: params.order.id,
      status: "latest",
    });

    const locale = params.locale || "en";
    const invoice = invoices[0];
    if (!invoice.content) {
      invoice.content = {};
    }
    invoice.content[locale] = invoice.content[locale] ?? await this.createPdfContent(params, invoice).then((content) => content.toString("base64"));

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