import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { generateInvoicePdfWorkflow } from "../../../../../workflows/invoice-generator"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { id } = req.params
    const { locale } = req.query
    
    const { result: {
        pdf_buffer,
    } } = await generateInvoicePdfWorkflow(req.scope)
        .run({
            input: {
                order_id: id,
                locale: locale?.toString() ?? "en",
            },
        })

    const buffer = Buffer.from(pdf_buffer)

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
        "Content-Length": buffer.length,
    })

    res.send(buffer)
}