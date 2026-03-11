import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CarFront } from "lucide-react";
import { CrudProvider } from "../../components/curd-provider";
import FitmentDataTable from "../../modules/fitment/fitment/components/data-table";
import FitmentEditDrawer from "../../modules/fitment/fitment/components/edit-drawer";

const FitmentsPage = () => {
  return (
    <CrudProvider entityName="fitment">
      <FitmentDataTable />
      <FitmentEditDrawer />
    </CrudProvider>
  );
};

export const config = defineRouteConfig({
  label: "nav.fitments",
  translationNs: "translation",
  icon: () => <CarFront size={15} />,
});

export default FitmentsPage;
