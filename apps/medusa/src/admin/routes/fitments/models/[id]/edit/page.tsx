import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import ModelEdit from "~/modules/fitment/model-edit";
import { sdk } from "~/lib/sdk";
import { Model } from "~/modules/fitment/schema";

const EditModelPage = () => {
  const { model } = useLoaderData() as { model: Model };
  return <ModelEdit model={model} />;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { model } = await sdk.client.fetch<{ model: Model }>(
    `/admin/models/${id}`,
    {
      query: { fields: "*make" },
    },
  );
  return { model };
}

export const config = defineRouteConfig({
  label: "Edit Model",
});

export default EditModelPage;
