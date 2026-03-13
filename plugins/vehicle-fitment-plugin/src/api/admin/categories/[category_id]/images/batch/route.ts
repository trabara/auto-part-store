import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { UpdateCategoryImagesInput } from "../../../../../../modules/product-media/schema"
import { DeleteCategoryImagesInput, deleteCategoryImagesWorkflow } from "../../../../../../workflows/product-media/delete-category-images"
import { updateCategoryImagesWorkflow } from "../../../../../../workflows/product-media/update-category-images"


export async function POST(
    req: MedusaRequest<UpdateCategoryImagesInput>,
    res: MedusaResponse
): Promise<void> {
    const { updates } = req.validatedBody

    const { result } = await updateCategoryImagesWorkflow(req.scope).run({
        input: { updates },
    })

    res.status(200).json({ category_images: result })
}

export async function DELETE(
    req: MedusaRequest<DeleteCategoryImagesInput>,
    res: MedusaResponse
): Promise<void> {
    const { ids } = req.validatedBody

    await deleteCategoryImagesWorkflow(req.scope).run({
        input: { ids },
    })

    res.status(200).json({
        deleted: ids,
    })
}