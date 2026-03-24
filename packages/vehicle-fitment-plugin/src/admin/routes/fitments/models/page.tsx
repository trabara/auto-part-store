import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CrudProvider } from "../../../components/crud-provider";
import ModelCreateModal from "../../../modules/fitment/model/components/create-modal";
import ModelDataTable from "../../../modules/fitment/model/components/data-table";
import ModelEditDrawer from "../../../modules/fitment/model/components/edit-drawer";

const ModelsPage = () => {
  return (
    <CrudProvider entityName="model">
      <ModelDataTable />
      <ModelEditDrawer />
      <ModelCreateModal />
    </CrudProvider>
  );
};

export const config = defineRouteConfig({
  label: "nav.models",
  translationNs: "translation",
});

export default ModelsPage;
