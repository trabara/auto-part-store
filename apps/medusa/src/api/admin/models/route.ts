import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    console.log("Query Config: ", req.queryConfig)
    console.log("Filterable Fields: ", req.filterableFields)
    const { data: models, metadata } = await query.graph({
        entity: "fitment_model",
        ...req.queryConfig,
        ...req.filterableFields,
    })

    res.json({ models, metadata })
}