import { z } from "@medusajs/framework/zod";
import { PencilSquare, Trash } from "@medusajs/icons";
import { Container } from "@medusajs/ui";
import type { RouteRenderContext } from "@repo/framework/admin";
import { featureLabel } from "@repo/framework/core";
import { isToOne, relationField } from "@repo/framework/entity";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { fieldUiOverrides } from "../helpers/field-ui-overrides";
import { useSdk } from "../../common/context";
import { DataTable } from "../components/data-table";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import type { FeatureFieldOverrides, RowAction, ToolbarAction } from "../types";
import { entityFields, toQueryFilters } from "../utils/query";
import { entityUrl, featurePath, featureRelations, useFeature } from "../utils/routes";

type Row = { id: string } & Record<string, any>;
type ListResponse = { data: Row[]; metadata: { count: number } };

const HIDDEN_COLUMNS = ["id", "updated_at", "deleted_at"];

/** Paginated, filterable table of a feature's entity. Renders `create` in its outlet. */
export function TemplateList({ outlet }: RouteRenderContext) {
  const { module, feature, entity } = useFeature();
  const sdk = useSdk();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toOne = useMemo(
    () =>
      featureRelations(module, feature).filter(
        (r) => r.targetEntity && isToOne(r.relation),
      ),
    [module, feature],
  );

  // Own scalar columns plus one column per to-one relation (keyed by its FK).
  const schema = useMemo(() => {
    const fkColumns = Object.fromEntries(
      toOne.map((r) => [relationField(r.key, r.relation) ?? r.key, z.string().nullish()]),
    );
    return entity.schema.extend(fkColumns) as z.ZodObject<any>;
  }, [entity, toOne]);

  const overrides = useMemo(() => {
    const result: FeatureFieldOverrides<any> = {};
    for (const key of HIDDEN_COLUMNS) result[key] = { hideLabel: true, isFiltrable: false };
    for (const r of toOne) {
      result[relationField(r.key, r.relation) ?? r.key] = {
        label: r.label,
        isFiltrable: false,
        cell: (info: any) => {
          const related = info.row.original[r.key];
          return related?.[r.targetEntity!.display] || related?.id || "-";
        },
      };
    }
    return {
      ...result,
      ...fieldUiOverrides(entity.schema),
      ...(feature.ui.overrides as FeatureFieldOverrides<any>),
    };
  }, [toOne, feature, entity]);

  const deletion = useDeleteMutation({
    invalidateKeys: [entity.modelName],
    errorMessage: t("common.error_delete_item", "Failed to delete"),
    successMessage: t("common.success_delete_item", "Deleted"),
    deleteFn: (id) => sdk.client.fetch(entityUrl(module, entity, id), { method: "DELETE" }),
  });

  const rowActions: RowAction<Row>[] = [
    {
      id: "edit",
      label: t("common.edit", "Edit"),
      icon: <PencilSquare />,
      onClick: (e, row) => {
        e.stopPropagation();
        navigate(featurePath(feature, "edit", { id: row.id })!);
      },
    },
    {
      id: "delete",
      label: t("common.delete", "Delete"),
      icon: <Trash />,
      variant: "danger",
      onClick: (e, row) => {
        e.stopPropagation();
        deletion.mutateAsync(row.id);
      },
    },
  ];

  const toolbarActions: ToolbarAction<Row>[] = [
    {
      id: "delete",
      label: t("common.delete", "Delete"),
      icon: <Trash />,
      variant: "danger",
      onClick: (table) => {
        const ids = table
          .getRowModel()
          .rows.filter((row) => row.getIsSelected())
          .map((row) => row.original.id);
        deletion.mutateAsync(...ids);
      },
    },
  ];

  return (
    <>
      <Container className="divide-y p-0">
        <DataTable<Row, ListResponse>
          id={entity.modelName}
          title={featureLabel(feature)}
          schema={schema as unknown as z.ZodType<Row>}
          overrides={overrides}
          queryFn={(signal, params) =>
            sdk.client.fetch<ListResponse>(entityUrl(module, entity), {
              signal,
              query: {
                limit: params.limit,
                offset: params.offset,
                order: params.order,
                fields: entityFields(module, feature),
                ...toQueryFilters(params.filters, schema),
              },
            })
          }
          selectFn={(resp) => ({ data: resp?.data, rowCount: resp?.metadata.count })}
          onRowClick={(_, row) => navigate(featurePath(feature, "detail", { id: row.id })!)}
          onCreateClicked={() => navigate(featurePath(feature, "create")!)}
          actionState={{ row: rowActions, toolbar: toolbarActions }}
        />
      </Container>
      {outlet}
    </>
  );
}
