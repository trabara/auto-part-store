import { OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types";
import { MedusaService } from "@medusajs/framework/utils";
import axios from "axios";
import Handlebars from "handlebars";
import { Browser, chromium } from "playwright";
import { Invoice } from "./models/invoice";
import { InvoiceConfig } from "./models/invoice-config";

type GeneratePdfParams = {
  order: OrderDTO;
  items: OrderLineItemDTO[];
  invoice_id: string;
  locale?: string;
};

const INVOICE_TEMPLATE = `
<!DOCTYPE html>
<html dir="{{dir}}">
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333; padding: 40px; direction: {{dir}}; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
    {{#if isRtl}}
    .header { flex-direction: row-reverse; }
    {{/if}}
    .company-info h1 { color: #2563eb; font-size: 28px; margin-bottom: 8px; }
    .company-info p { margin-bottom: 4px; }
    .invoice-info { text-align: right; }
    {{#if isRtl}}
    .invoice-info { text-align: left; }
    .company-info { text-align: right; }
    {{/if}}
    .invoice-info h2 { font-size: 24px; color: #333; margin-bottom: 8px; }
    .invoice-meta { color: #666; font-size: 12px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    {{#if isRtl}}
    .parties { flex-direction: row-reverse; }
    {{/if}}
    .party { width: 45%; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
    .party p { margin-bottom: 4px; }
    .party .name { font-weight: bold; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    {{#if isRtl}}
    th { text-align: right; }
    {{/if}}
    th:last-child, td:last-child { text-align: right; }
    {{#if isRtl}}
    th:first-child, td:first-child { text-align: right; }
    th:last-child, td:last-child { text-align: left; }
    {{/if}}
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { margin-left: auto; width: 300px; }
    {{#if isRtl}}
    .totals { margin-right: auto; margin-left: 0; }
    {{/if}}
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { border-top: 2px solid #2563eb; font-weight: bold; font-size: 18px; margin-top: 8px; padding-top: 16px; }
    .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
    .notes h4 { margin-bottom: 8px; color: #333; }
  </style>
</head>
<body>
    <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        {{#if companyLogo}}
        <img src="{{companyLogo}}" alt="{{companyName}}" style="max-height: 60px; margin-bottom: 10px;" />
        {{else}}
        <h1>{{companyName}}</h1>
        {{/if}}
        <p>{{companyAddress}}</p>
        {{#if companyPhone}}<p>{{companyPhone}}</p>{{/if}}
        {{#if companyEmail}}<p>{{companyEmail}}</p>{{/if}}
      </div>
      <div class="invoice-info">
        <h2>{{t.invoice}}</h2>
        <div class="invoice-meta">
          <p><strong>#{{invoiceNumber}}</strong></p>
          <p>{{t.date}}: {{invoiceDate}}</p>
          <p>{{t.due}}: {{dueDate}}</p>
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>{{t.billTo}}</h3>
        <p class="name">{{customerName}}</p>
        <p>{{customerAddress}}</p>
        <p>{{customerCity}}, {{customerCountry}}</p>
        {{#if customerPhone}}<p>{{customerPhone}}</p>{{/if}}
        {{#if customerEmail}}<p>{{customerEmail}}</p>{{/if}}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{t.description}}</th>
          <th>{{t.qty}}</th>
          <th>{{t.unitPrice}}</th>
          <th>{{t.total}}</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td>{{description}}{{#if sku}}<br><small style="color: #666;">SKU: {{sku}}</small>{{/if}}</td>
          <td>{{quantity}}</td>
          <td>{{currency}} {{unitPrice}}</td>
          <td>{{currency}} {{total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>{{t.subtotal}}</span>
        <span>{{currency}} {{subtotal}}</span>
      </div>
      {{#if discount}}
      <div class="totals-row">
        <span>{{t.discount}}</span>
        <span>-{{currency}} {{discount}}</span>
      </div>
      {{/if}}
      {{#if shipping}}
      <div class="totals-row">
        <span>{{t.shipping}}</span>
        <span>{{currency}} {{shipping}}</span>
      </div>
      {{/if}}
      <div class="totals-row">
        <span>{{t.tax}} ({{taxRate}}%)</span>
        <span>{{currency}} {{taxAmount}}</span>
      </div>
      <div class="totals-row total">
        <span>{{t.grandTotal}}</span>
        <span>{{currency}} {{total}}</span>
      </div>
    </div>

    {{#if notes}}
    <div class="notes">
      <h4>{{t.notes}}</h4>
      <p>{{notes}}</p>
    </div>
    {{/if}}
  </div>
</body>
</html>
`;

class InvoiceGeneratorService extends MedusaService({
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

  private getTranslations(locale: string = "en") {
    const translations: Record<string, Record<string, string>> = {
      en: {
        invoice: "INVOICE",
        billTo: "Bill To",
        description: "Description",
        qty: "Qty",
        unitPrice: "Unit Price",
        total: "Total",
        subtotal: "Subtotal",
        discount: "Discount",
        shipping: "Shipping",
        tax: "Tax",
        taxRate: "Tax (%)",
        grandTotal: "Total",
        notes: "Notes",
        paymentTerms: "Payment Terms",
        date: "Date",
        due: "Due",
        quantity: "Quantity",
      },
      fr: {
        invoice: "FACTURE",
        billTo: "Facturer à",
        description: "Description",
        qty: "Qté",
        unitPrice: "Prix unitaire",
        total: "Total",
        subtotal: "Sous-total",
        discount: "Remise",
        shipping: "Livraison",
        tax: "Taxe",
        taxRate: "Taxe (%)",
        grandTotal: "Total",
        notes: "Notes",
        paymentTerms: "Conditions de paiement",
        date: "Date",
        due: "Échéance",
        quantity: "Quantité",
      },
      ar: {
        invoice: "فاتورة",
        billTo: "فاتورة إلى",
        description: "الوصف",
        qty: "الكمية",
        unitPrice: "سعر الوحدة",
        total: "المجموع",
        subtotal: "المجموع الفرعي",
        discount: "الخصم",
        shipping: "الشحن",
        tax: "الضريبة",
        taxRate: "نسبة الضريبة (%)",
        grandTotal: "الإجمالي",
        notes: "ملاحظات",
        paymentTerms: "شروط الدفع",
        date: "التاريخ",
        due: "الموعد",
        quantity: "الكمية",
      },
    };
    return translations[locale] || translations.en;
  }

  async generatePdf(params: GeneratePdfParams): Promise<Buffer> {
    const invoices = await this.listInvoices({
      order_id: params.order.id,
      status: "latest",
    });

    const invoice = invoices[0];
    const config = await this.listInvoiceConfigs({});
    const invoiceConfig = config[0];

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
      ? await this.imageUrlToBase64(invoiceConfig.company_logo)
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
      t: this.getTranslations(params.locale || "en"),
    };
    const template = Handlebars.compile(INVOICE_TEMPLATE);
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
