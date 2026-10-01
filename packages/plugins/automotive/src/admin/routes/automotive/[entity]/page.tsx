import { Module } from "@repo/dashboard/module";
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
    <Module {...{ sdk, module: moduleDef }}>
      <Module.List entity={entity!} config={config.pages.list} />
      <Outlet />
    </Module>
  );
}

export const handle = {
  breadcrumb: ({ params }: UIMatch) => {
    return startCase(toLower(params.entity));
  },
};

export const config = defineRouteConfig(moduleDef.getRouter());
