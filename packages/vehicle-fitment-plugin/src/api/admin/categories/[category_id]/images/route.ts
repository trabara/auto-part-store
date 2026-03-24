import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CreateCategoryImagesInput } from "../../../../../modules/category-media/schema"
import { createCategoryImagesWorkflow } from "../../../../../workflows/product-media"


export async function POST(
    req: MedusaRequest<CreateCategoryImagesInput>,
    res: MedusaResponse
): Promise<void> {
    const { category_id } = req.params
    const { images } = req.validatedBody

    // Add category_id to each image
    const category_images = images.map((image) => ({
        ...image,
        category_id,
    }))

    const { result } = await createCategoryImagesWorkflow(req.scope).run({
        input: {
            category_images,
        },
    })

    res.status(200).json({ category_images: result })
}

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { category_id } = req.params
    const query = req.scope.resolve("query")

    const { data: categoryImages } = await query.graph({
        entity: "product_category_image",
        fields: ["*"],
        filters: {
            category_id,
        },
    })

    res.status(200).json({ category_images: categoryImages })
}