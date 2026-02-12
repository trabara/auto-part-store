import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import FitmentModule from "../modules/fitment"

export default defineLink(
    {
        linkable: FitmentModule.linkable.fitment,
        isList: true,
    },
    ProductModule.linkable.product
)
