import { MedusaCrud } from "@repo/medusa-ui";
import { startCase, toLower } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, UIMatch, useParams } from "react-router-dom";
import { sdk } from "../../../lib/sdk";
import moduleDef from "../../../modules/automotive";

export default function EntityPage() {
  const { t } = useTranslation();
  const { entity } = useParams();

  const config = useMemo(() => moduleDef.getFeature(entity!, t), []);

  return (
    <MedusaCrud {...{ sdk, config }}>
      <MedusaCrud.List />
      <Outlet />
    </MedusaCrud>
  );
}

export const handle = {
  breadcrumb: ({ params }: UIMatch) => {
    return startCase(toLower(params.entity));
  },
};
