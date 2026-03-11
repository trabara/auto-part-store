import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CrudProvider } from "../../../components/crud-provider";
import EngineCreateModal from "../../../modules/fitment/engine/components/create-modal";
import EngineDataTable from "../../../modules/fitment/engine/components/data-table";
import EngineEditDrawer from "../../../modules/fitment/engine/components/edit-drawer";

const EnginesPage = () => {
  return (
    <CrudProvider entityName="engine">
      <EngineDataTable />
      <EngineEditDrawer />
      <EngineCreateModal />
    </CrudProvider>
  );
};

export const config = defineRouteConfig({
  label: "nav.engines",
  translationNs: "translation",
});

export default EnginesPage;
