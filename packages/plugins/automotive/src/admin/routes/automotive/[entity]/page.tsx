import { MedusaCrud } from "@repo/medusa-ui";
import { startCase, toLower } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, UIMatch, useParams } from "react-router-dom";
import { sdk } from "../../../lib/sdk";
import { entityConfig } from "../config";

export default function EntityPage() {
  const { t } = useTranslation();
  const { entity } = useParams();

  const config = useMemo(() => entityConfig(entity!, t), []);

  const title = startCase(toLower(entity!));

  return (
    <MedusaCrud {...{ sdk, config }}>
      <MedusaCrud.List title={title} />
      <Outlet />
    </MedusaCrud>
  );
}

export const handle = {
  breadcrumb: ({ params }: UIMatch) => {
    return startCase(toLower(params.entity));
  },
};
