import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import FitmentProductLink from "../../../../../links/fitment-product";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
        entity: FitmentProductLink.entryPoint,
        fields: ["product.*", "product.variants.*"],
        filters: {
            fitment_id: id
        },
    })
    const products = data.map((item) => item.product)

    return res.json({
        products: products,
        count: products.length
    })
}
