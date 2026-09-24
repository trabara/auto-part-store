// export async function loader(args: LoaderFunctionArgs) {}

import { MedusaCrud } from "@repo/medusa-ui";
import { useTranslation } from "react-i18next";
import { Outlet, useParams } from "react-router-dom";
import { sdk } from "../../../../lib/sdk";
import { createPageConfig } from "../config";
import { useMemo } from "react";

// export const handle = {
//   breadcrumb: ({ loaderData }: UIMatch<AdminVehicleEngineRetrieveResponse>) =>
//     loaderData?.data.repair_request.id ?? "Repair Request",
// };

const VehicleEngineDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const config = useMemo(() => createPageConfig(t), []);

  return (
    <MedusaCrud sdk={sdk} config={config}>
      <MedusaCrud.Detail id={id} dataMount="data.repair_request">
        <Outlet />
      </MedusaCrud.Detail>
    </MedusaCrud>
  );
};

export default VehicleEngineDetailPage;
