import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { sdk } from "~/admin/lib/sdk";
import MakeEdit from "~/admin/modules/fitment/make-edit";
import { MakeWithModels } from "~/admin/modules/fitment/make-list/types";

const EditMakePage = () => {
  const { make } = useLoaderData() as { make: MakeWithModels };
  return <MakeEdit make={make} />;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { make } = await sdk.client.fetch<{ make: MakeWithModels }>(
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
