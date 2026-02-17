import { defineRouteConfig } from "@medusajs/admin-sdk";
import EngineCreate from "~/modules/fitment/engine-create";

const CreateEnginePage = () => {
  return <EngineCreate />;
};

export const config = defineRouteConfig({
  label: "Create Engine",
});

export default CreateEnginePage;
