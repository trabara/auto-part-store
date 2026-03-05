import { MedusaService } from "@medusajs/framework/utils";
import { InvoiceConfig } from "./models/invoice-config";

import * as fs from "fs/promises";
import Handlebars from "handlebars";
import * as path from "path";
import { chromium } from "playwright";
import { GenerateInvoicePdfStepInput } from "./dtos";
import { Invoice } from "./models/invoice";

export class InvoiceGeneratorService extends MedusaService({
  InvoiceConfig,
  Invoice,
}) {
  private async createPdf(templateId: string, data: any): Promise<Buffer> {
    const templatePath = path.join(
      __dirname,
      "templates",
      `${templateId}.html`,
    );
    let templateContent: string;
    try {
      templateContent = await fs.readFile(templatePath, "utf-8");
    } catch (err) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    const tmpl = Handlebars.compile(templateContent)(data);

    // Generate PDF using Playwright
    const browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        "/usr/bin/chromium-browser",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    let pdfBuffer: Buffer;

    try {
      const page = await browser.newPage();
      await page.setContent(tmpl, { waitUntil: "networkidle" });

      pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "50px",
          right: "50px",
          bottom: "50px",
          left: "50px",
        },
      });
    } finally {
      await browser.close();
    }

    return pdfBuffer;
  }

  public async generatePdf({
    order,
    items,
    invoice_id,
  }: GenerateInvoicePdfStepInput): Promise<Buffer> {
    const invoice = await this.retrieveInvoice(invoice_id);

    // Get invoice configuration
    const invoiceConfigs = await this.listInvoiceConfigs();
    const config = invoiceConfigs[0];

    // Prepare data for template
    const invoiceDate = new Date(invoice.created_at);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

    // Calculate totals
    const shippingTotal = Number(order.shipping_total || 0);
    const totalHT = Number(order.subtotal);
    const totalVAT = Number(order.tax_total || 0);
    const totalTTC = Number(order.total);

    // Format items
    const itemsFormatted = items.map((item) => {
      const unitPrice = Number(item.unit_price);
      const quantity = item.quantity;
      const taxTotal = Number(item.tax_total);
      const totalWithTax = Number(item.total);
      const taxRate = (taxTotal / (unitPrice * quantity)) * 100;

      return {
        description: item.title,
        quantity: quantity,
        unitPrice: unitPrice.toFixed(2),
        taxRate: taxRate.toFixed(0),
        totalTax: taxTotal.toFixed(2),
        totalWithTax: totalWithTax.toFixed(2),
      };
    });

    return this.createPdf(config.template_id, {
      // Company Info
      companyName: config.company_name,
      companyAddress: config.company_address,
      companyLogo: config.company_logo,
      companyEmail: config.company_email,
      companyPhone: config.company_phone,
      // Client Info
      customerName:
        order.shipping_address?.first_name +
        " " +
        order.shipping_address?.last_name || "Client",
      customerAddress: order.shipping_address?.address_1 || "",
      customerPostalCode: order.shipping_address?.postal_code || "",
      customerCity: order.shipping_address?.city || "",
      // Invoice Info
      invoiceDate: invoiceDate.toLocaleDateString("fr-FR"),
      invoiceNumber: `INV-${invoice.display_id.toString().padStart(6, "0")}`,
      dueDate: dueDate.toLocaleDateString("fr-FR"),
      paymentTerms: "30 jours",
      reference: order.display_id?.toString() || "",
      additionalInfo: config.notes,
      // Items
      items: itemsFormatted,
      // Totals
      totalHT: totalHT.toFixed(2),
      totalVAT: totalVAT.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
      shippingTotal: shippingTotal.toFixed(2),

      // currency
      currencyCode: order.currency_code.toUpperCase(),
    });
  }
}
