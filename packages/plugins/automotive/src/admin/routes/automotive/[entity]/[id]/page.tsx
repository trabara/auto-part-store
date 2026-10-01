// export async function loader(args: LoaderFunctionArgs) {}

import { Module } from "@repo/dashboard/module";

import { zodQueryResolve } from "@repo/utils";
import { useTranslation } from "react-i18next";
import {
  LoaderFunctionArgs,
  Outlet,
  useLoaderData,
  useParams,
} from "react-router-dom";
import { sdk } from "../../../../lib/sdk";
import moduleDef from "../../../../modules/automotive";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id, entity } = params;

  const feature = moduleDef.getFeature(entity!);

  return sdk.client.fetch<{ data: any }>(
    `admin${moduleDef.path}/${entity}/${id}`,
    {
      query: {
        fields: zodQueryResolve(feature.pages.details.schema),
      },
    },
  );
}

const DetailPage = () => {
  const { entity } = useParams<{ entity: string; id: string }>();
  const { t } = useTranslation();

  const config = moduleDef.getFeature(entity!, t);
  const data = useLoaderData() as Awaited<{ data: any; entity: string }>;

  return (
    <Module {...{ sdk, module: moduleDef }}>
      <Module.Detail
        entity={entity!}
        initialData={data.data}
        config={config.pages.details}
      >
        <Outlet />
      </Module.Detail>
    </Module>
  );
};

export const handle = {
  breadcrumb: ({ params }: any) => {
    return <span className="capitalize">{params.id}</span>;
  },
};

export default DetailPage;
