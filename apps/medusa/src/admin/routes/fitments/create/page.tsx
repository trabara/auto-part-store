import { defineRouteConfig } from "@medusajs/admin-sdk"
import CreateFitmentModal from "~/features/fitment-create"

const CreateFitmentPage = () => {
    return <CreateFitmentModal />
}

export const config = defineRouteConfig({

})

export default CreateFitmentPage