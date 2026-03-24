import { z } from "@medusajs/framework/zod"

export const CreateCategoryImagesSchema = z.object({
    images: z.array(
        z.object({
            type: z.enum(["thumbnail", "image"]),
            url: z.string(),
            file_id: z.string(),
        })
    ).min(1, "At least one image is required"),
})

export type CreateCategoryImagesInput = z.infer<typeof CreateCategoryImagesSchema>

export const UpdateCategoryImagesSchema = z.object({
    updates: z.array(z.object({
        id: z.string(),
        type: z.enum(["thumbnail", "image"]),
    })).min(1, "At least one update is required"),
})

export type UpdateCategoryImagesInput = z.infer<typeof UpdateCategoryImagesSchema>

export const DeleteCategoryImagesSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
})

export type DeleteCategoryImagesInput = z.infer<typeof DeleteCategoryImagesSchema>
