import FitmentList from "../../../../modules/fitment/fitment/components/data-table";
import { useParams } from "react-router-dom"

const ProductFitmentsPage = () => {
    const { id } = useParams();
    return <FitmentList productId={id} />;
};


export default ProductFitmentsPage;
