import { z } from "@medusajs/framework/zod"

export const UploadedFileSchema = z.object({
    id: z.string().optional(),
    type: z.enum(["thumbnail", "image"]),
    url: z.string(),
    file_id: z.string(),
})

export type UploadedFile = z.infer<typeof UploadedFileSchema>


export const MediaSchema = UploadedFileSchema.extend({
    entity_id: z.string(),
})

export type Media = z.infer<typeof MediaSchema>


export const CreateMediasSchema = z.object({
    images: z.array(UploadedFileSchema).min(1, "At least one image is required"),
})

export type CreateMediasInput = z.infer<typeof CreateMediasSchema>

export const UpdateMediasSchema = z.object({
    updates: z.array(z.object({
        id: z.string(),
        type: z.enum(["thumbnail", "image"]),
    })).min(1, "At least one update is required"),
})

export type UpdateMediasInput = z.infer<typeof UpdateMediasSchema>

export const DeleteMediasSchema = z.object({
    ids: z.array(z.string()).min(1, "At least one ID is required"),
})

export type DeleteMediasInput = z.infer<typeof DeleteMediasSchema>
