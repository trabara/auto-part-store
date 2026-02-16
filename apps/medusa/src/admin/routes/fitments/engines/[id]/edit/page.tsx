import { defineRouteConfig } from "@medusajs/admin-sdk";
import EngineEdit, { loader } from "~/features/engine-edit";

const EditEnginePage = () => {
  return <EngineEdit />;
};

export { loader };

export const config = defineRouteConfig({
  label: "Edit Engine",
});

export default EditEnginePage;
