import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "../../modules/fitment";
import { Link } from "@medusajs/framework/modules-sdk";

type LinkFitmentsToProductInput = {
    product_id: string,
    fitment_ids: string[],
}

export const linkFitmentsToProductStep = createStep(
    "link-fitments-to-product",
    async function (input: LinkFitmentsToProductInput, { container }) {
        const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
        await Promise.all(input.fitment_ids.map((fitment_id) => link.create({
            [Modules.PRODUCT]: {
                product_id: input.product_id,
            },
            [FITMENT_MODULE]: {
                fitment_id,
            }
        })))
        return new StepResponse({}, { product_id: input.product_id, fitment_ids: input.fitment_ids });
    },
    async function (input: LinkFitmentsToProductInput, { container }) {
        if (!input) {
            return
        }
        const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
        await Promise.all(input.fitment_ids.map((fitment_id) => link.delete({
            [Modules.PRODUCT]: {
                product_id: input.product_id,
            },
            [FITMENT_MODULE]: {
                fitment_id,
            }
        })))
    }
)