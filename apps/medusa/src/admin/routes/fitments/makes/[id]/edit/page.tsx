import { defineRouteConfig } from "@medusajs/admin-sdk";
import MakeEdit, { loader } from "~/features/make-edit";

const EditMakePage = () => {
  return <MakeEdit />;
};

export { loader };

export const config = defineRouteConfig({
  label: "Edit Make",
});

export default EditMakePage;
