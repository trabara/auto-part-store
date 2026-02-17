import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
} from "react-router-dom";
import FitmentEdit from "~/modules/fitment/fitment-edit";
import FitmentList from "~/modules/fitment/fitment-list";
import { sdk } from "~/lib/sdk";
import { Fitment } from "~/modules/fitment/schema";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { fitment } = await sdk.client.fetch<{ fitment: Fitment }>(
    `/admin/fitments/${id}`,
    {
      query: { fields: "*engine,*model,*model.make" },
    },
  );
  return { fitment };
}

const EditFitmentPage = () => {
  const { fitment } = useLoaderData() as { fitment: Fitment };
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <FitmentEdit fitment={fitment} onClose={handleClose} open />
  );
};
export const config = defineRouteConfig({
  label: "Edit Fitment",
  nested: "/orders",
});

export default EditFitmentPage;
