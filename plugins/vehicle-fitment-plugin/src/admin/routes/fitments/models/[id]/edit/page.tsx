import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { Model } from "../../../../../../modules/fitment/schema";
import { sdk } from "../../../../../lib/sdk";
import ModelEdit from "../../../../../modules/fitment/model/components/edit-drawer";

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
