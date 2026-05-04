import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { INVOICE_MODULE } from "@repo/domain-modules/invoice-generator";
import { CreateInvoiceConfig } from "@trabara/core";
import { IInvoiceGeneratorModuleService } from "@trabara/core/interfaces";

export const createInvoiceConfigStep = createStep(
    "create-invoice-config",
    async (dto: CreateInvoiceConfig, { container }) => {
        const invoiceGeneratorService = container.resolve<IInvoiceGeneratorModuleService>(INVOICE_MODULE);
        const invoiceConfig = await invoiceGeneratorService.createInvoiceConfigs([dto]);
        return new StepResponse(invoiceConfig);
    },
    async (prevData, { container }) => {
        if (!prevData) {
            return;
        }
        const invoiceGeneratorService = container.resolve<IInvoiceGeneratorModuleService>(INVOICE_MODULE);
        await invoiceGeneratorService.delete(prevData.map((c) => c.id));
    }
);