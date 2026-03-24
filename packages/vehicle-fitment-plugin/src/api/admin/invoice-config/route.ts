import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PostInvoiceConfig } from "../../../modules/invoice-generator/schema"
import { updateInvoiceConfigWorkflow } from "../../../workflows/invoice-generator"

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const query = req.scope.resolve("query")

    const { data: [invoiceConfig] } = await query.graph({
        entity: "invoice_config",
        fields: ["*"],
    })

    res.json({
        invoice_config: invoiceConfig,
    })
}

export async function POST(req: MedusaRequest<PostInvoiceConfig>, res: MedusaResponse) {
    const { result: {
        invoice_config }
    } = await updateInvoiceConfigWorkflow(req.scope)
        .run({
            input: req.validatedBody,
        })

    res.json({ invoice_config, })
}