import { defineRouteConfig } from "@medusajs/admin-sdk";
import { MedusaCrud } from "@repo/medusa-ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { sdk } from "../../../lib/sdk";
import { createPageConfig } from "./config";
import { Outlet } from "react-router-dom";

export default function VehicleEnginesPage() {
  const { t } = useTranslation();
  const config = useMemo(() => createPageConfig(t), []);

  return (
    <MedusaCrud sdk={sdk} config={config}>
      <MedusaCrud.List title="Vehicle Engines" />
      <Outlet />
    </MedusaCrud>
  );
}

export const handle = {
  breadcrumb: () => "Engines",
};

export const config = defineRouteConfig({
  label: "nav.engines",
  translationNs: "translation",
});
