import { PencilSquare, Trash } from "@medusajs/icons";
import { Button, Container, Hint, UseDataTableReturn } from "@medusajs/ui";
import { zodQueryResolve } from "@repo/utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "../components/data-table";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import {
  PageQueryParams,
  RowAction,
  SelectFn,
  ToolbarAction,
} from "../lib/types";
import { useMedusaCrud } from "../provider/medusa-crud";
import { useSdk } from "../provider/sdk-provider";

type MedusaCrudListProps<T extends { id: string }> = {
  title: string;
  description?: string;
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction<T>[];
  onRowClick?: (row: T) => void;
};

const MedusaListPage = function List<T extends { id: string }>({
  title,
  description,
  rowActions,
  toolbarActions,
  onRowClick,
  ...restProps
}: MedusaCrudListProps<T>) {
  const sdk = useSdk();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { config } = useMedusaCrud();

  const queryFields = useMemo(
    () => zodQueryResolve(config.listSchema),
    [config.listSchema],
  );

  const listAction = (signal: AbortSignal, params?: PageQueryParams) =>
    sdk.client.fetch(`/admin${config.path}`, {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: queryFields,
      },
    });

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [config.path],
    errorMessage: t("common.error_delete_item"),
    successMessage: t("common.success_delete_item"),
    deleteFn: (id: string) =>
      sdk.client.fetch(`/admin${config.path}/${id}`, { method: "DELETE" }),
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
      onClick: (row) =>
        navigate(`${config.path}/${row.id}/edit`, { state: row }),
    },
    {
      id: "delete",
      label: t("common.delete"),
      icon: <Trash />,
      variant: "danger",
      onClick: (row) => deleteMutation.mutateAsync(row.id),
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

  const parseData = (data: []): T[] => {
    return config.listSchema.array().parse(data) as T[];
  };

  const handleDataSelect: SelectFn<T, any> = (resp) => {
    if (config.listMount === undefined) {
      const data = parseData(resp?.data || []);
      console.log(data);
      return {
        data,
        rowCount: resp?.metadata.count || 0,
      };
    }

    const data = parseData(resp?.data[config.listMount] || []);

    return {
      data,
      rowCount: resp?.metadata.count ?? 0,
    };
  };

  const handleRowClick = (row: T) => {
    if (onRowClick !== undefined) {
      return onRowClick(row);
    }
    navigate(`${config.path}/${row.id}`);
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="font-sans font-medium h1-core">{title}</h1>
          {description && <Hint>{description}</Hint>}
        </div>
        <Button variant="secondary" size="small" asChild>
          <Link to={`${config.path}/create`}>Create</Link>
        </Button>
      </div>

      <DataTable
        id={config.path}
        schema={config.listSchema}
        fields={config.listFields}
        queryFn={listAction}
        selectFn={handleDataSelect}
        onRowClick={handleRowClick}
        rowActions={[...defaultRowActions, ...(rowActions || [])]}
        toolbarActions={[...defaultToolbarActions, ...(toolbarActions || [])]}
        {...restProps}
      />
    </Container>
  );
};

export default MedusaListPage;
