import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { sdk } from "~/admin/lib/sdk";
import ModelEdit from "~/admin/modules/fitment/model-edit";
import { Model } from "~/modules/fitment/schema";

type Response = {
  model: Model;
}

const EditModelPage = () => {
  const { model } = useLoaderData() as Response;
  return <ModelEdit model={model} />;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  return sdk.client.fetch<Response>(
    `/admin/models/${id}`,
    {
      query: { fields: "*make" },
    },
  );
}

export const config = defineRouteConfig({
  label: "Edit Model",
});

export default EditModelPage;
