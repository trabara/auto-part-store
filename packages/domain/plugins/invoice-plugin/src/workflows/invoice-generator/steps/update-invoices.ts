import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  INVOICE_MODULE,
  InvoiceStatus,
} from "@repo/domain-modules/invoice-generator";
import { IInvoiceGeneratorModuleService } from "@trabara/core";

type StepInput = {
  selector: {
    order_id: string;
  };
  data: {
    status: InvoiceStatus;
  };
};
export const updateInvoicesStep = createStep(
  "update-invoices",
  async ({ selector, data }: StepInput, { container }) => {
    const invoiceGeneratorService = container.resolve<IInvoiceGeneratorModuleService>(INVOICE_MODULE);

    const prevData = await invoiceGeneratorService.list(selector);

    const updatedInvoices = await invoiceGeneratorService.update(
      prevData.map((i: any) => ({ id: i.id, ...data })),
    );

    return new StepResponse(updatedInvoices, prevData);
  },
  async (prevData, { container }) => {
    if (!prevData) {
      return;
    }

    const invoiceGeneratorService = container.resolve<IInvoiceGeneratorModuleService>(INVOICE_MODULE);

    await invoiceGeneratorService.update(
      prevData.map((i) => ({
        id: i.id,
        status: i.status,
      })),
    );
  },
);
