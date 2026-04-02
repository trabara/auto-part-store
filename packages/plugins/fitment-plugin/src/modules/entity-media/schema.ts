import { z } from "@medusajs/framework/zod"

export const UploadedFileSchema = z.object({
    id: z.string().optional(),
    type: z.enum(["thumbnail", "image"]),
    url: z.string(),
    file_id: z.string(),
})

export type UploadedFile = z.infer<typeof UploadedFileSchema>

export const EntityImageSchema = UploadedFileSchema.extend({
    entity_id: z.string(),
})

export type EntityImage = z.infer<typeof EntityImageSchema>


export const CreateEntityImagesSchema = z.object({
    images: z.array(UploadedFileSchema).min(1, "At least one image is required"),
})

export type CreateEntityImagesInput = z.infer<typeof CreateEntityImagesSchema>

export const UpdateEntityImagesSchema = z.object({
    updates: z.array(z.object({
        id: z.string(),
        type: z.enum(["thumbnail", "image"]),
    })).min(1, "At least one update is required"),
})

export type UpdateEntityImagesInput = z.infer<typeof UpdateEntityImagesSchema>

export const DeleteEntityImagesSchema = z.object({
    ids: z.array(z.string()).min(1, "At least one ID is required"),
})

export type DeleteEntityImagesInput = z.infer<typeof DeleteEntityImagesSchema>
