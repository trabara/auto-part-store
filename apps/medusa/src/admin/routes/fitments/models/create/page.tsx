import { defineRouteConfig } from "@medusajs/admin-sdk";
import ModelCreate from "~/features/model-create";

const CreateModelPage = () => {
  return <ModelCreate />;
};

export const config = defineRouteConfig({
  label: "Create Model",
});

export default CreateModelPage;
