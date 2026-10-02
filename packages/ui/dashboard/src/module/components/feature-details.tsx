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

type Scalar = { key: string; value: string; schema: z.ZodTypeAny };
type Many = {
  key: string;
  value: Record<string, any>[];
  schema: z.ZodTypeAny;
};
type One = { key: string; value: Record<string, any>; schema: z.ZodTypeAny };

export type Attribute = Scalar | Many | One;

function classifyAttributes<T extends Record<string, unknown>>(
  module: ModuleType,
  entityKey: string,
  schema: z.ZodType<T>,
  data: T,
) {
  const scalar: Scalar[] = [];
  const many: Many[] = [];
  const one: One[] = [];

  const shape = getZodShape(schema);
  let relations: Record<string, { targetEntity?: string }> | undefined;
  try {
    relations = module.getFeature(entityKey).relations;
  } catch {
    relations = undefined;
  }

  forEach(shape, (attr, key) => {
    const info = getZodFieldInfo(attr);
    const value = data?.[key];

    // Prefer explicit relation config for the target entity key
    const explicit = relations?.[key];
    const entityKeys = Object.keys(module.getFeatures());
    const entityId =
      explicit?.targetEntity ??
      entityKeys.find((k) => k === key) ??
      entityKeys.find((k) => k.endsWith(`_${key}`)) ??
      key;

    if (info.baseType === "array") {
      const elementSchema = unwrap(
        ensureZodObject(attr as unknown as z.ZodType<any>),
      );
      many.push({
        key: entityId,
        value: (value as Record<string, any>[]) ?? [],
        schema: elementSchema,
      });
    } else if (info.baseType === "object") {
      one.push({
        key: entityId,
        value: (value as Record<string, any>) ?? {},
        schema: attr,
      });
    } else {
      scalar.push({
        key,
        value: value != null ? String(value) : "—",
        schema: attr,
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

  const attributes = useMemo(
    () => classifyAttributes(module, entity, config.schema, initialData),
    [module, entity, config.schema, initialData],
  );

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [module.path, entity],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: async (id: string) => {
      await sdk.client.fetch(`/admin${module.path}/${entity}/${id}`, {
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
            label: t("common.edit"),
            icon: <Pencil />,
            onClick: () =>
              navigate(`${module.path}/${entity}/${initialData.id}/edit`),
          },
          {
            id: "delete",
            label: t("common.delete"),
            icon: <Trash />,
            onClick: () => deleteMutation.mutateAsync(initialData.id),
          },
        ]}
      />,
      ...attributes.many.map(({ key, schema, value }) => {
        const parentId = initialData?.id;
        const parentFilterKey = `${entity}_id`;
        return (
          <Container key={key} className="divide-y p-0">
            <DataTable
              id={key}
              title={_.startCase(key)}
              schema={schema as unknown as z.ZodType<T>}
              overrides={{}}
              queryFn={(signal, params) => {
                const query: Record<string, unknown> = {
                  ...params,
                  fields: zodQueryResolve(schema),
                };
                if (parentId) {
                  query[parentFilterKey] = parentId;
                }
                return sdk.client.fetch<{
                  data: T[];
                  metadata: { count: number };
                }>(`/admin${module.path}/${key}`, {
                  signal,
                  query,
                });
              }}
            />
          </Container>
        );
      }),
    ],
    [attributes, title, initialData, entity],
  );

  const sideSections = useMemo(() => {
    return attributes.one.map(({ key, value, schema }) => {
      const entries = Object.entries(value ?? {}).filter(
        ([, v]) => v != null,
      );
      return (
        <DetailsSection
          key={key}
          title={_.startCase(key)}
          attributes={entries.map(([k, v]) => ({
            key: k,
            value: v != null ? String(v) : "—",
            schema: z.any(),
          }))}
        />
      );
    });
  }, [attributes.one]);

  const preferredLayoutId =
    mainSections.length > 0 && sideSections.length > 0
      ? "core:two-column"
      : "core:single-column";

  return (
    <>
      <LayoutComposer
        data={initialData}
        widgetsZonePrefix={`${entity}.details`}
        preferredLayoutId={preferredLayoutId}
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
