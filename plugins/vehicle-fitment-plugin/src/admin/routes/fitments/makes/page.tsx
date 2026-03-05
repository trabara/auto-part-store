import { defineRouteConfig } from "@medusajs/admin-sdk";
import MakeList from "../../../modules/fitment/make/components/data-table";
const MakesPage = () => {
  return <MakeList />;
};

export const config = defineRouteConfig({
  label: "Makes",
});

export default MakesPage;
