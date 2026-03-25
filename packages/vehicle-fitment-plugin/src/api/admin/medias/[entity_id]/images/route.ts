import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CreateEntityImagesInput } from "../../../../../modules/entity-media/schema"
import { createEntityImagesWorkflow } from "../../../../../workflows/entity-media"


export async function POST(
    req: MedusaRequest<CreateEntityImagesInput>,
    res: MedusaResponse
): Promise<void> {
    const { entity_id } = req.params
    const { images } = req.validatedBody

    // Add entity_id to each image
    const entity_images = images.map((image) => ({
        ...image,
        entity_id: entity_id,
    }))

    const { result } = await createEntityImagesWorkflow(req.scope).run({
        input: {
            images: entity_images,
        },
    })
    res.status(200).json({ images: result })

}

export async function GET(
    req: MedusaRequest,
    res: MedusaResponse
): Promise<void> {
    const { entity_id } = req.params
    const query = req.scope.resolve("query")

    const { data: entityImages } = await query.graph({
        entity: "entity_image",
        fields: ["*"],
        filters: {
            entity_id: entity_id,
        },
    })

    res.status(200).json({ images: entityImages })
}