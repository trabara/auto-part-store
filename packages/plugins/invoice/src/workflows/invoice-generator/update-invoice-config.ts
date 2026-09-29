import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateInvoiceConfigStep } from "./steps/update-invoice-config"

type UpdateInvoiceConfigWorkflowInput = any & {
    id: string
}

export const updateInvoiceConfigWorkflow = createWorkflow(
    "update-invoice-config",
    (input: UpdateInvoiceConfigWorkflowInput) => {
        const invoiceConfig = updateInvoiceConfigStep(input)

        return new WorkflowResponse({
            invoice_config: invoiceConfig,
        })
    }
)