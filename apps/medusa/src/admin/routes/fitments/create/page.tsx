import { defineRouteConfig } from "@medusajs/admin-sdk"
import CreateFitmentModal from "~/admin/modules/fitment/fitment-create"

const CreateFitmentPage = () => {
    return <CreateFitmentModal />
}

export const config = defineRouteConfig({

})

export default CreateFitmentPage