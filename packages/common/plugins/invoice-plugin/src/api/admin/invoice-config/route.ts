import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CreateInvoiceConfig } from "@trabara/core";
import { updateInvoiceConfigWorkflow } from "../../../workflows/invoice-generator";
import { createInvoiceConfigWorkflow } from "../../../workflows/invoice-generator/create-invoice-config";

/**
 * GET /admin/invoice-config
 * Get the invoice configuration
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");

  const {
    data: [invoice_config],
  } = await query.graph({
    entity: "invoice_config",
    fields: ["*"],
  });

  res.status(200).json({ invoice_config });
}

/**
 * POST /admin/invoice-config
 * Update the invoice configuration
 */
export async function POST(
  req: MedusaRequest<CreateInvoiceConfig>,
  res: MedusaResponse,
) {
  const { id } = req.params;

  if (id) {
    const { result: invoice_config } = await updateInvoiceConfigWorkflow(
      req.scope,
    ).run({
      input: { id, ...req.validatedBody },
    });

    res.status(200).json({ invoice_config });
    return;
  }

  const { result: invoice_config } = await createInvoiceConfigWorkflow(
    req.scope,
  ).run({
    input: req.validatedBody,
  });

  res.status(200).json({ invoice_config });
}
