import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { FITMENT_MODULE } from "../../../../modules/fitment"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    const { id } = req.params
    const fitmentModuleService = req.scope.resolve(FITMENT_MODULE)
    await fitmentModuleService.deleteFitments(id)
}

