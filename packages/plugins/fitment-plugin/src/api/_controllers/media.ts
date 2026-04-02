import { BaseController } from "@repo/common";
import { CreateEntityImagesInput, UpdateEntityImagesInput } from "../../modules/entity-media/schema";
import { createEntityImagesWorkflow, deleteEntityImagesWorkflow, updateEntityImagesWorkflow } from "../../workflows/entity-media";

/**
 * Media Controller
 *
 * Handles all media-related HTTP requests.
 * Following SRP: Single responsibility is handling media HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class MediaController extends BaseController {
    constructor(req, res) {
        super(req, res)
    }

    public async list(): Promise<void> {
        await this.execute(async () => {
            const { entity_id } = this.req.params
            const query = this.req.scope.resolve("query")

            const { data: entityImages } = await query.graph({
                entity: "entity_image",
                fields: ["*"],
                filters: {
                    entity_id: entity_id,
                },
            })

            this.success({ images: entityImages });
        }, "Media list retrieved successfully");
    }

    public async createBatch(): Promise<void> {
        await this.execute(async () => {
            const { entity_id } = this.req.params
            const { images } = this.req.validatedBody as CreateEntityImagesInput

            // Add entity_id to each image
            const entity_images = images.map((image) => ({
                ...image,
                entity_id: entity_id,
            }))

            const { result } = await createEntityImagesWorkflow(this.req.scope).run({
                input: {
                    images: entity_images,
                },
            })
            this.success({ images: result })
        }, "Media created successfully");
    }

    public async updateBatch(): Promise<void> {
        await this.execute(async () => {
            this.logger.info("Updating media for entity", {
                entity: this.req.params.entity,
                entity_id: this.req.params.id,
            })

            const { updates } = this.req.validatedBody as UpdateEntityImagesInput

            const { result } = await updateEntityImagesWorkflow(this.req.scope).run({
                input: { updates },
            })

            this.success({ images: result })


        }, "Media updated successfully");
    }

    public deleteBatch(): Promise<void> {
        return this.execute(async () => {
            const { ids } = this.req.validatedBody as { ids: string[] }

            await deleteEntityImagesWorkflow(this.req.scope).run({
                input: { ids },
            })

            this.success({ deleted: ids });
        }, "Media deleted successfully");
    }
}