import { InferTypeOf } from "@medusajs/framework/types";
import { model } from "@medusajs/framework/utils"

export const Media = model.define("entity_media", {
    id: model.id().primaryKey(),
    url: model.text(),
    file_id: model.text(),
    type: model.enum(["thumbnail", "image"]),
    entity_id: model.text(),
})
    .indexes([
        {
            on: ["entity_id", "type"],
            where: "type = 'thumbnail'",
            unique: true,
            name: "unique_thumbnail_per_entity",
        },
    ])

export type Media = InferTypeOf<typeof Media>;
