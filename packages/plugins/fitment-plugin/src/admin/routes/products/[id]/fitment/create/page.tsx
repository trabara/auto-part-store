import { defineRouteConfig } from "@medusajs/admin-sdk"
import CreateFitmentModal from "../../../../../modules/fitment/fitment/components/create-modal"

const CreateFitmentPage = () => {
  return <CreateFitmentModal />
}

export const config = defineRouteConfig({})

export default CreateFitmentPage