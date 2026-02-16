import FitmentList from "~/features/fitment-list";
import { useParams } from "react-router-dom"

const ProductFitmentsPage = () => {
    const { id } = useParams();
    return <FitmentList productId={id} />;
};


export default ProductFitmentsPage;
