import { useParams } from "react-router-dom";
import FitmentList from "../../../fitments/components/data-table";

const ProductFitmentsPage = () => {
  const { id } = useParams();
  return <FitmentList productId={id} />;
};

export default ProductFitmentsPage;
