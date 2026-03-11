import { defineRouteConfig } from "@medusajs/admin-sdk";
import EngineList from "../../../modules/fitment/engine/components/data-table";

const EnginesPage = () => {
  return <EngineList />;
};

export const config = defineRouteConfig({
  label: "nav.engines",
  translationNs: "translation",
});

export default EnginesPage;
