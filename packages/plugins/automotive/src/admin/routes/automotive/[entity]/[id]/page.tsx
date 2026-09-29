// export async function loader(args: LoaderFunctionArgs) {}

import { MedusaCrud } from "@repo/medusa-ui";
import { zodQueryResolve } from "@repo/medusa-ui/utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunctionArgs, Outlet, useParams } from "react-router-dom";
import { sdk } from "../../../../lib/sdk";
import moduleDef from "../../../../modules/automotive";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id, entity } = params;

  const feature = moduleDef.getFeature(entity!);

  return sdk.client.fetch<{ data: any }>(
    `${feature.path}/${feature.entity})}/${id}`,
    {
      query: {
        fields: zodQueryResolve(feature.details.schema),
      },
    },
  );
}

const DetailPage = () => {
  const { id, entity } = useParams<{ entity: string; id: string }>();
  const { t } = useTranslation();

  const config = useMemo(() => moduleDef.getFeature(entity!, t), []);

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
