import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const fields = req.query.fields
        ? req.query.fields?.toString().split(",").map(f => f.trim())
        : ["*"]

    const { data: options } = await query.graph({
        entity: "product_option",
        fields,
    })

    res.json({ options })
}