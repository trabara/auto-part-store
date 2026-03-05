import { defineRouteConfig } from "@medusajs/admin-sdk";
import FitmentEdit from "../../../../modules/fitment/fitment/components/edit-drawer";

const EditFitmentPage = () => {
  return (
    <FitmentEdit />
  );
};

export const config = defineRouteConfig({
  label: "Edit Fitment",
  nested: "/orders",
});

export default EditFitmentPage;
