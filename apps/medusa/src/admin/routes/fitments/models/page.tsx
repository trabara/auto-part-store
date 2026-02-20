import { defineRouteConfig } from "@medusajs/admin-sdk";
import ModelList from "~/admin/modules/fitment/model/components/data-table-list";

const ModelsPage = () => {
  return <ModelList />;
};

export const config = defineRouteConfig({
  label: "Models",
});

export default ModelsPage;
