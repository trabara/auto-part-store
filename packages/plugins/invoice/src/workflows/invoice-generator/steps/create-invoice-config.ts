import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CreateInvoiceConfig } from "@repo/core";
import { INVOICE_MODULE } from "../../../modules/invoice-generator";
import InvoiceGeneratorService from "../../../modules/invoice-generator/service";

export const createInvoiceConfigStep = createStep(
    "create-invoice-config",
    async (dto: CreateInvoiceConfig, { container }) => {
        const invoiceGeneratorService = container.resolve<InvoiceGeneratorService>(INVOICE_MODULE);
        const invoiceConfig = await invoiceGeneratorService.createInvoiceConfigs([dto]);
        return new StepResponse(invoiceConfig);
    },
    async (prevData, { container }) => {
        if (!prevData) {
            return;
        }
        const invoiceGeneratorService = container.resolve<InvoiceGeneratorService>(INVOICE_MODULE);
        await invoiceGeneratorService.deleteInvoiceConfigs(prevData.map((c) => c.id));
    }
);