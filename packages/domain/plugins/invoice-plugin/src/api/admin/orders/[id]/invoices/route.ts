import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { OrderController } from "../../../../_controllers/order";

/**
 * GET /admin/orders/:id/invoices
 * Generate an invoice PDF for a specific order
 */
export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const controller = new OrderController(req, res);
    await controller.generateInvoice();
}