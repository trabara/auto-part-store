import { defineRouteConfig } from "@medusajs/admin-sdk";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import EngineEdit from "~/features/engine-edit";
import { sdk } from "~/lib/sdk";
import { Engine } from "~/modules/fitment/schema";

const EditEnginePage = () => {
  const { engine } = useLoaderData() as { engine: Engine };
  return <EngineEdit engine={engine} />;
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
