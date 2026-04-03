import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { InvoiceController } from "../../_controllers/invoice";

/**
 * GET /admin/invoice-config
 * Get the invoice configuration
 */
export async function GET(
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse
) {
    const controller = new InvoiceController(req, res);
    await controller.getConfig();
}

/**
 * POST /admin/invoice-config
 * Update the invoice configuration
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
    const controller = new InvoiceController(req, res);
    await controller.updateConfig();
}