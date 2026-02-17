import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useParams } from "react-router-dom"
import CreateFitmentModal from "~/admin/modules/fitment/fitment-create"

const CreateFitmentPage = () => {
  const { id } = useParams()
  return <CreateFitmentModal productId={id} />
}

export const config = defineRouteConfig({})

export default CreateFitmentPage