import { z } from "@medusajs/framework/zod";
import { PencilSquare, Trash } from "@medusajs/icons";
import { Container, UseDataTableReturn } from "@medusajs/ui";
import { zodQueryResolve } from "@repo/utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../components/data-table";
import { useMedusaCrud } from "../context/crud";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { useSdk } from "../provider/sdk-provider";
import {
  FeaturePageConfig,
  PageQueryParams,
  RowAction,
  SelectFn,
  ToolbarAction,
} from "../types";

type MedusaCrudListProps<T extends { id: string }> = {
  entity: string;
  config: FeaturePageConfig;
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction<T>[];
};

const MedusaListPage = function List<T extends { id: string }>({
  config,
  entity,
  rowActions,
  toolbarActions,
  ...restProps
}: MedusaCrudListProps<T>) {
  const sdk = useSdk();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { module } = useMedusaCrud();

  const queryFields = useMemo(
    () => zodQueryResolve(config.schema),
    [config.schema],
  );

  const listAction = (signal: AbortSignal, params?: PageQueryParams) =>
    sdk.client.fetch(`/admin${module.path}/${entity}`, {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: queryFields,
      },
    });

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [module.path],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: (id: string) =>
      sdk.client.fetch(`/admin${module.path}/${entity}/${id}`, {
        method: "DELETE",
      }),
  });

  const handleBulkDelete = async (table: UseDataTableReturn<T>) => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);
    const selectedIds = selectedRows.map((row) => row.id);
    await deleteMutation.mutateAsync(...selectedIds);
  };

  const defaultRowActions: RowAction<T>[] = [
    {
      id: "edit",
      label: t("common.edit"),
      icon: <PencilSquare />,
      onClick: (e, row) => {
        e.stopPropagation();
        navigate(`${module.path}/${entity}/${row.id}/edit`);
      },
    },
    {
      id: "delete",
      label: t("common.delete"),
      icon: <Trash />,
      variant: "danger",
      onClick: (e, row) => {
        e.stopPropagation();
        deleteMutation.mutateAsync(row.id);
      },
    },
  ];

  const defaultToolbarActions: ToolbarAction<T>[] = [
    {
      id: "delete",
      icon: <Trash />,
      variant: "danger",
      label: t("common.delete"),
      onClick: (table) => handleBulkDelete(table),
    },
  ];

  const handleDataSelect: SelectFn<T, any> = (resp) => {
    return {
      data: z.array(config.schema).parse(resp?.data || []) as T[],
      rowCount: resp?.metadata.count ?? 0,
    };
  };

  const handleRowClick = (
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: T,
  ) => {
    navigate(`${module.path}/${entity}/${row.id}`);
  };

  const title = config.getTitle();
  const columns =
    (typeof config.fields === "function" ? config.fields(t) : config.fields) ||
    {};

  return (
    <Container className="divide-y p-0">
      <DataTable
        id={module.id}
        schema={config.schema}
        title={title}
        fields={columns}
        queryFn={listAction}
        selectFn={handleDataSelect}
        onRowClick={handleRowClick}
        onCreateClicked={() => navigate(`${module.path}/${entity}/create`)}
        rowActions={[...defaultRowActions, ...(rowActions || [])]}
        toolbarActions={[...defaultToolbarActions, ...(toolbarActions || [])]}
        {...restProps}
      />
    </Container>
  );
};

export default MedusaListPage;
