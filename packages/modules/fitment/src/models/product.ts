import { model } from "@medusajs/framework/utils"
import { Fitment } from "./fitment"
export const FitmentProduct = model.define("fitment_product", {
    id: model.id().primaryKey(),
    fitment: model.belongsTo(() => Fitment, {
        mappedBy: "products",
    }),
    product_id: model.text(),
}).indexes([
    {
        on: ["fitment_id", "product_id"],
        unique: true,
    },
])