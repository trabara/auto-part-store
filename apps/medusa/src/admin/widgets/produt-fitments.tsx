import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading } from '@medusajs/ui'
import { useNavigate, useParams } from 'react-router-dom'
const ProductFitmentsWidget = () => {
    const navigate = useNavigate()
    const params = useParams()


    return <Container className="p-0">
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex flex-col divide-y">
                <div className="px-6 py-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                    <Heading>Fitments</Heading>
                    <Button variant="secondary" size="small" className="ml-auto" onClick={() => navigate(`/products/${params.id}/fitment/create`)}>
                        Create
                    </Button>
                </div>
            </div>

        </div>
    </Container>
}

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

export default ProductFitmentsWidget