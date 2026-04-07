import { OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { INVOICE_MODULE } from "@repo/domain-modules/invoice-generator";

export type GenerateInvoicePdfStepInput = {
  order: OrderDTO;
  items: OrderLineItemDTO[];
  invoice_id: string;
  locale?: string;
};

export const generateInvoicePdfStep = createStep(
  "generate-invoice-pdf",
  async (input: GenerateInvoicePdfStepInput, { container }) => {
    const invoiceGeneratorService = container.resolve<any>(INVOICE_MODULE);

    const previousInv = await invoiceGeneratorService.retrieve(
      input.invoice_id,
    );

    const pdfBuffer = await invoiceGeneratorService.generatePdf({
      order: input.order,
      items: input.items,
      invoice_id: input.invoice_id,
      locale: input.locale,
    });

    return new StepResponse(
      {
        pdf_buffer: pdfBuffer,
      },
      previousInv,
    );
  },
  async (previousInv, { container }) => {
    if (!previousInv) {
      return;
    }

    const invoiceGeneratorService = container.resolve<any>(INVOICE_MODULE);

    await invoiceGeneratorService.update({
      id: previousInv.id,
      pdfContent: previousInv.pdfContent,
    });
  },
);
