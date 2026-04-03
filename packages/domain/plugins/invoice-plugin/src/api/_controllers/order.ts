import { BaseController } from "@trabara/common";
import { generateInvoicePdfWorkflow } from "../../workflows/invoice-generator";

/**
 * Order Controller
 *
 * Handles all order-related HTTP requests.
 * Following SRP: Single responsibility is handling order HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class OrderController extends BaseController {
    public async generateInvoice(): Promise<void> {
        await this.execute(async () => {
            const { id } = this.req.params;
            const { locale } = this.req.query;

            const { result: {
                pdf_buffer,
            } } = await generateInvoicePdfWorkflow(this.req.scope)
                .run({
                    input: {
                        order_id: id,
                        locale: locale?.toString() || 'en'
                    },
                })

            const buffer = Buffer.from(pdf_buffer)

            this.res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
                "Content-Length": buffer.length,
            })

            this.res.send(buffer)
        }, "Invoice generated successfully");
    }

}
