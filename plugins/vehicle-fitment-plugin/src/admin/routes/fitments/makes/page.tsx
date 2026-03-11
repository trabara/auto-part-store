import { defineRouteConfig } from "@medusajs/admin-sdk";
import MakeList from "../../../modules/fitment/make/components/data-table";
const MakesPage = () => {
  return <MakeList />;
};

export const config = defineRouteConfig({
  label: "nav.makes",
  translationNs: "translation",
});

export default MakesPage;
