import { defineRouteConfig } from "@medusajs/admin-sdk"
import CreateFitmentModal from "../../../../fitments/components/create-modal"

const CreateFitmentPage = () => {
  return <CreateFitmentModal />
}

export const config = defineRouteConfig({})

export default CreateFitmentPage