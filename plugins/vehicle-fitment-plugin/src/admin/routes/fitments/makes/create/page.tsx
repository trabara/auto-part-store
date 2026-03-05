import { defineRouteConfig } from "@medusajs/admin-sdk";
import MakeCreate from "../../../../modules/fitment/make/components/create-modal";

const CreateMakePage = () => {
  return <MakeCreate />;
};

export const config = defineRouteConfig({
  label: "Create Make",
});

export default CreateMakePage;
