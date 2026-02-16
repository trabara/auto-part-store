import { defineRouteConfig } from "@medusajs/admin-sdk";
import MakeCreate from "~/features/make-create";

const CreateMakePage = () => {
  return <MakeCreate />;
};

export const config = defineRouteConfig({
  label: "Create Make",
});

export default CreateMakePage;
