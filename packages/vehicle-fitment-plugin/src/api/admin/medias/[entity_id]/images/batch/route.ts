import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DeleteEntityImagesInput, UpdateEntityImagesInput } from "../../../../../../modules/entity-media/schema"
import { deleteEntityImagesWorkflow, updateEntityImagesWorkflow } from "../../../../../../workflows/entity-media"

export async function POST(
    req: MedusaRequest<UpdateEntityImagesInput>,
    res: MedusaResponse
): Promise<void> {
    const { updates } = req.validatedBody

    const { result } = await updateEntityImagesWorkflow(req.scope).run({
        input: { updates },
    })

    res.status(200).json({ images: result })
}

export async function DELETE(
    req: MedusaRequest<DeleteEntityImagesInput>,
    res: MedusaResponse
): Promise<void> {
    const { ids } = req.validatedBody

    await deleteEntityImagesWorkflow(req.scope).run({
        input: { ids },
    })

    res.status(200).json({
        deleted: ids,
    })
}