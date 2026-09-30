import { MedusaCrud } from "@repo/dashboard";
import { startCase, toLower } from "lodash";
import { useTranslation } from "react-i18next";
import { Outlet, UIMatch, useParams } from "react-router-dom";
import moduleDef from "../../../modules/automotive";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { sdk } from "../../../lib/sdk";

export default function EntityPage() {
  const { t } = useTranslation();
  const { entity } = useParams();
  const config = moduleDef.getFeature(entity!, t);

  return (
    <MedusaCrud {...{ sdk, module: moduleDef }}>
      <MedusaCrud.List entity={entity!} config={config.pages.list} />
      <Outlet />
    </MedusaCrud>
  );
}

export const handle = {
  breadcrumb: ({ params }: UIMatch) => {
    return startCase(toLower(params.entity));
  },
};

export const config = defineRouteConfig(moduleDef.getRouter());
