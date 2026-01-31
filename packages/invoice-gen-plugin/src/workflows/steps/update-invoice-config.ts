import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { INVOICE_MODULE } from "../../modules/invoice-gen";
import { InvoiceConfigDTO } from "../../modules/invoice-gen/dtos";
import { InvoiceGeneratorService } from "../../modules/invoice-gen/service";

export const updateInvoiceConfigStep = createStep(
  "update-invoice-config",
  async ({ id, ...updateData }: Partial<InvoiceConfigDTO>, { container }) => {
    const invoiceGeneratorService =
      container.resolve<InvoiceGeneratorService>(INVOICE_MODULE);

    const prevData = id
      ? await invoiceGeneratorService.retrieveInvoiceConfig(id)
      : (await invoiceGeneratorService.listInvoiceConfigs())[0];

    const updatedData = await invoiceGeneratorService.updateInvoiceConfigs({
      id: prevData.id,
      ...updateData,
    });

    return new StepResponse(updatedData, prevData);
  },
  async (prevInvoiceConfig, { container }) => {
    if (!prevInvoiceConfig) {
      return;
    }

    const invoiceGeneratorService =
      container.resolve<InvoiceGeneratorService>(INVOICE_MODULE);

    await invoiceGeneratorService.updateInvoiceConfigs({
      id: prevInvoiceConfig.id,
      company_name: prevInvoiceConfig.company_name,
      company_address: prevInvoiceConfig.company_address,
      company_phone: prevInvoiceConfig.company_phone,
      company_email: prevInvoiceConfig.company_email,
      company_logo: prevInvoiceConfig.company_logo,
    });
  },
);
