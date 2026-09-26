// export async function loader(args: LoaderFunctionArgs) {}

import { MedusaCrud } from "@repo/medusa-ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LoaderFunctionArgs,
  Outlet,
  UIMatch,
  useLoaderData,
  useParams,
} from "react-router-dom";
import { sdk } from "../../../../lib/sdk";
import { entityConfig } from "../../config";
import { lowerCase, snakeCase } from "lodash";
import { VehicleEngineSchema } from "../../../../../modules/fitment/schemas/vehicle";
import { zodQueryResolve } from "@repo/medusa-ui/utils";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id, entity } = params;
  // TODO fetch product by id
  return sdk.client.fetch<{ data: any }>(
    `/admin/automotive/${snakeCase(lowerCase(entity))}/${id}`,
    {
      query: {
        fields: zodQueryResolve(VehicleEngineSchema),
      },
    },
  );
}

const DetailPage = () => {
  const { id, entity } = useParams<{ entity: string; id: string }>();
  const { t } = useTranslation();

  const config = useMemo(() => entityConfig(entity!, t), []);

  return (
    <MedusaCrud sdk={sdk} config={config}>
      <MedusaCrud.Detail id={id}>
        <Outlet />
      </MedusaCrud.Detail>
    </MedusaCrud>
  );
};

export const handle = {
  breadcrumb: ({ params }: any) => {
    return <span className="capitalize">{params.id}</span>;
  },
};

export default DetailPage;
