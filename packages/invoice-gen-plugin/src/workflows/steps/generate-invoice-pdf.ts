import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { INVOICE_MODULE } from "../../modules/invoice-gen";
import { GenerateInvoicePdfStepInput } from "../../modules/invoice-gen/dtos";
import { InvoiceGeneratorService } from "../../modules/invoice-gen/service";

export const generateInvoicePdfStep = createStep(
  "generate-invoice-pdf",
  async (input: GenerateInvoicePdfStepInput, { container }) => {
    const invoiceGeneratorService =
      container.resolve<InvoiceGeneratorService>(INVOICE_MODULE);

    const previousInv = await invoiceGeneratorService.retrieveInvoice(
      input.invoice_id,
    );

    const pdfBuffer = await invoiceGeneratorService.generatePdf({
      order: input.order,
      items: input.items,
      invoice_id: input.invoice_id,
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

    const invoiceGeneratorService =
      container.resolve<InvoiceGeneratorService>(INVOICE_MODULE);

    await invoiceGeneratorService.updateInvoices({
      id: previousInv.id,
      pdfContent: previousInv.pdfContent,
    });
  },
);
