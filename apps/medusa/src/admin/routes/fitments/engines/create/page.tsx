import { defineRouteConfig } from "@medusajs/admin-sdk";
import EngineCreate from "~/admin/modules/fitment/engine/components/create-modal";

const CreateEnginePage = () => {
  return <EngineCreate />;
};

export const config = defineRouteConfig({
  label: "Create Engine",
});

export default CreateEnginePage;
