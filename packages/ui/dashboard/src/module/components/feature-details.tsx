import { LayoutComposer } from "@medusajs/dashboard/components";
import { z } from "@medusajs/framework/zod";
import { Pencil, Trash } from "@medusajs/icons";
import { Container } from "@medusajs/ui";
import {
  getZodFieldInfo,
  getZodShape,
  unwrap,
  zodQueryResolve,
} from "@repo/utils";
import _, { forEach } from "lodash";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSdk } from "../../common/context";
import { DetailsSection } from "../components/details-section";
import { useModule } from "../context/module";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { ModuleType, PageConfig } from "../types";
import { DataTable } from "./data-table";
import { ensureZodObject } from "../helpers/create-zod-columns";

type DetailsFeatureProps = {
  config: PageConfig;
  entity: string;
  initialData?: any;
  children?: React.ReactNode;
};

type Scalar = { key: string; value: string; schema: z.ZodAny };
type Many = {
  key: string;
  value: Record<string, any>[];
  schema: z.ZodType;
};
type One = { key: string; value: Record<string, any>; schema: z.ZodAny };

export type Attribute = Scalar | Many | One;

function classifyAttributes<T extends Record<string, unknown>>(
  module: ModuleType,
  schema: z.ZodType<T>,
  data: T,
) {
  const scalar: Scalar[] = [];
  const many: Many[] = [];
  const one: One[] = [];

  const shape = getZodShape(schema);

  forEach(shape, (attr, key) => {
    const info = getZodFieldInfo(attr);
    const value = data[key];

    const entityIds = Object.keys(module.getFeatures());
    const entityId =
      entityIds.find((entityId) => entityId.includes(key)) || key;

    if (info.baseType === "array") {
      const schema = unwrap(ensureZodObject(attr));
      many.push({
        key: entityId,
        value: value as Record<string, any>[],
        schema: schema,
      });
    } else if (info.baseType === "object") {
      one.push({
        key: entityId,
        value: value as Record<string, any>,
        schema: schema,
      });
    } else {
      scalar.push({
        key: entityId,
        value: String(value),
        schema: schema,
      });
    }
  });

  return { scalar, many, one };
}

const DetailsFeature = <T extends { id: string }>({
  initialData,
  entity,
  config,
  children,
}: DetailsFeatureProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const sdk = useSdk();

  const module = useModule(initialData);

  const title = config.getTitle(initialData);

  // Group the entity's own fields by data relationship: many -> a data
  // table for the main column, one -> a details block for the side
  // column, and plain scalar attributes -> the entity's own "General"
  // details block, also in the side column. Runs unconditionally (before
  // the early returns below) to respect the Rules of Hooks; `data` may
  // still be undefined here while the query is loading.
  const attributes = useMemo(
    () => classifyAttributes(module, config.schema, initialData),
    [config.schema, initialData],
  );

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [module.path, entity],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: async (id: string) => {
      await sdk.client.fetch(`/admin${module.path}/${entity}${id}`, {
        method: "DELETE",
      });
      navigate(module.path);
    },
  });

  const mainSections = useMemo(
    () => [
      <DetailsSection
        key="__general"
        title={title}
        attributes={attributes.scalar}
        actions={[
          {
            id: "edit",
            label: "Modifé",
            icon: <Pencil />,
            onClick: () =>
              navigate(`${module.path}/${entity}/${initialData.id}/edit`),
          },
          {
            id: "delete",
            label: "Supprimer",
            icon: <Trash />,
            onClick: () => deleteMutation.mutateAsync(initialData.id),
          },
        ]}
      />,
      ...attributes.many.map(({ key, schema, value }) => (
        <Container key={key} className="divide-y p-0">
          <DataTable
            key={key}
            id={key}
            title={_.startCase(key)}
            schema={schema}
            overrides={{}}
            queryFn={(signal, params) => {
              console.log(key, schema);
              return sdk.client.fetch<{
                data: T[];
                metadata: { count: number };
              }>(`/admin${module.path}/${key}`, {
                signal,
                query: {
                  ...params,
                  fields: zodQueryResolve(schema),
                },
              });
            }}
          />
        </Container>
      )),
    ],
    [],
  );

  const sideSections = useMemo(
    () => [
      // ...attributes.one.map(([key, relation]) => (
      //   <DetailsSection
      //     key={key}
      //     title={_.startCase(key)}
      //     attributes={Object.entries(relation ?? {})}
      //   />
      // )),
    ],
    [attributes.one],
  );

  const preferredLayoutId = () => {
    if (mainSections.length > 0 && sideSections.length > 0) {
      return "core:two-column";
    }
    return "core:single-column";
  };

  return (
    <>
      <LayoutComposer
        data={initialData}
        widgetsZonePrefix={`${entity}.details`}
        preferredLayoutId={preferredLayoutId()}
        sections={{
          main: mainSections,
          side: sideSections,
        }}
      />
      {children}
    </>
  );
};

export default DetailsFeature;
