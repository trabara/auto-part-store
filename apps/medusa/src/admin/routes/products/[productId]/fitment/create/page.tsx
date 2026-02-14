import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useParams } from "react-router-dom"
import CreateFitmentModal from "~/features/fitment-create"

const CreateFitmentPage = () => {
  const { productId } = useParams()
  return <CreateFitmentModal productId={productId} />
}

export const config = defineRouteConfig({})

export default CreateFitmentPage