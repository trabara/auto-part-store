import { defineRouteConfig } from "@medusajs/admin-sdk";
import MakeList from "~/admin/modules/fitment/make-list";
const MakesPage = () => {
  return <MakeList />;
};

export const config = defineRouteConfig({
  label: "Makes",
});

export default MakesPage;
