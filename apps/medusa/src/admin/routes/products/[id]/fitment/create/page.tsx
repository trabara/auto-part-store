import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useParams } from "react-router-dom"
import CreateFitmentModal from "~/admin/modules/fitment/fitment/components/create-modal"

const CreateFitmentPage = () => {
  const { id } = useParams()
  return <CreateFitmentModal />
}

export const config = defineRouteConfig({})

export default CreateFitmentPage