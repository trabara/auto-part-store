import { defineRouteConfig } from "@medusajs/admin-sdk";
import { EntityCrudProvider } from "../../../components/crud-provider";
import MakeCreateModal from "../../../modules/fitment/make/components/create-modal";
import MakeDataTable from "../../../modules/fitment/make/components/data-table";
import MakeEditDrawer from "../../../modules/fitment/make/components/edit-drawer";

const MakesPage = () => {
  return (
    <EntityCrudProvider entityName="make">
      <MakeDataTable />
      <MakeEditDrawer />
      <MakeCreateModal />
    </EntityCrudProvider>
  );
};

export const config = defineRouteConfig({
  label: "nav.makes",
  translationNs: "translation",
});

export default MakesPage;
