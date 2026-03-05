import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import EngineEditDrawer from "../../../../../modules/fitment/engine/components/edit-drawer";
import { sdk } from "../../../../../lib/sdk";
import { Engine } from "../../../../../../modules/fitment/schema";

const EditEnginePage = () => {
  const { engine } = useLoaderData() as { engine: Engine };
  return <EngineEditDrawer engine={engine} />;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const { engine } = await sdk.client.fetch<{ engine: Engine }>(
    `/admin/engines/${id}`,
  );
  return { engine };
}

export const config = defineRouteConfig({
  label: "Edit Engine",
});

export default EditEnginePage;
