import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { InvoiceController } from "../../_controllers/invoice";

/**
 * GET /admin/invoice-config
 * Get the invoice configuration
 */
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const controller = new InvoiceController(req, res);
    await controller.getConfig();
}

/**
 * POST /admin/invoice-config
 * Update the invoice configuration
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const controller = new InvoiceController(req, res);
    await controller.upsertConfig();
}