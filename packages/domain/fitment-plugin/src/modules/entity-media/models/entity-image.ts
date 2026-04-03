import { model } from "@medusajs/framework/utils"

const EntityImage = model.define("entity_image", {
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

export default EntityImage