import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CarFront } from "lucide-react";
import { EntityCrudProvider } from "../../components/crud-provider";
import FitmentDataTable from "../../modules/fitment/fitment/components/data-table";
import FitmentEditDrawer from "../../modules/fitment/fitment/components/edit-drawer";
import FitmentCreateModal from "../../modules/fitment/fitment/components/create-modal";

const FitmentsPage = () => {
  return (
    <EntityCrudProvider entityName="fitment">
      <FitmentDataTable />
      <FitmentEditDrawer />
      <FitmentCreateModal />
    </EntityCrudProvider>
  );
};

export const config = defineRouteConfig({
  label: "nav.fitments",
  translationNs: "translation",
  icon: () => <CarFront size={15} />,
});

export default FitmentsPage;
