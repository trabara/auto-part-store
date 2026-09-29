import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createInvoiceConfigStep } from "./steps/create-invoice-config";

export const createInvoiceConfigWorkflow = createWorkflow(
  "create-invoice-config",
  (input: any) => {
    const invoiceConfig = createInvoiceConfigStep(input);

    return new WorkflowResponse({
      invoice_config: invoiceConfig,
    });
  },
);
