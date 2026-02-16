import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs } from "react-router-dom";
import MakeEdit from "~/features/make-edit";
import { sdk } from "~/lib/sdk";
import { Make } from "~/modules/fitment/schema";

const EditMakePage = ({ make }: { make: Make }) => {
  return <MakeEdit make={make} />;
};
  
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { make } = await sdk.client.fetch<{ make: Make }>(
    `/admin/makes/${id}`,
    {
      query: { fields: "*models" },
    },
  );
  return { make };
}


export const config = defineRouteConfig({
  label: "Edit Make",
});

export default EditMakePage;
