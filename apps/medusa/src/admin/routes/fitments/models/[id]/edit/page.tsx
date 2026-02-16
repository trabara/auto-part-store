import { defineRouteConfig } from "@medusajs/admin-sdk";
import ModelEdit, { loader } from "~/features/model-edit";

const EditModelPage = () => {
  return <ModelEdit />;
};

export { loader };

export const config = defineRouteConfig({
  label: "Edit Model",
});

export default EditModelPage;
