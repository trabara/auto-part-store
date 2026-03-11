import { defineRouteConfig } from "@medusajs/admin-sdk";
import ModelList from "../../../modules/fitment/model/components/data-table";

const ModelsPage = () => {
  return <ModelList />;
};

export const config = defineRouteConfig({
  label: "nav.models",
  translationNs: "translation",
});

export default ModelsPage;
