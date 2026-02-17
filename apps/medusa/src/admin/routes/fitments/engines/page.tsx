import { defineRouteConfig } from "@medusajs/admin-sdk";
import EngineList from "~/modules/fitment/engine-list";

const EnginesPage = () => {
  return <EngineList />;
};

export const config = defineRouteConfig({
  label: "Engines",
});

export default EnginesPage;
