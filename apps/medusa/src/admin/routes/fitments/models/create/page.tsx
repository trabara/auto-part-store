import { defineRouteConfig } from "@medusajs/admin-sdk";
import ModelCreate from "~/admin/modules/fitment/model/components/create-modal";

const CreateModelPage = () => {
  return <ModelCreate />;
};

export const config = defineRouteConfig({
  label: "Create Model",
});

export default CreateModelPage;
