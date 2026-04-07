import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  INVOICE_MODULE,
  InvoiceStatus,
} from "@repo/domain-modules/invoice-generator";

type StepInput = {
  order_id: string;
};

export const getOrderInvoiceStep = createStep(
  "get-order-invoice",
  async ({ order_id }: StepInput, { container }) => {
    const invoiceGeneratorService = container.resolve<any>(INVOICE_MODULE);
    let [invoice] = await invoiceGeneratorService.list({
      order_id,
      status: InvoiceStatus.LATEST,
    });
    let createdInvoice = false;

    if (!invoice) {
      // Store new invoice in database
      const [created] = await invoiceGeneratorService.create([
        {
          order_id,
          status: InvoiceStatus.LATEST,
          content: {},
        },
      ]);
      invoice = created;
      createdInvoice = true;
    }

    return new StepResponse(invoice, {
      created_invoice: createdInvoice,
      invoice_id: invoice.id,
    });
  },
  async (data, { container }) => {
    const { created_invoice, invoice_id } = data || {};
    if (!created_invoice || !invoice_id) {
      return;
    }
    const invoiceGeneratorService = container.resolve<any>(INVOICE_MODULE);

    invoiceGeneratorService.delete(invoice_id);
  },
);
