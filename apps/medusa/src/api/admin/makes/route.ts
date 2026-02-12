import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: makes } = await query.graph({
        entity: "fitment_make",
        ...req.queryConfig
    })

    res.json({ makes })
}