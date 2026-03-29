import { PageResponse, QueryFn } from "@/types/query";
import { Trash } from "@medusajs/icons";
import {
  Button,
  DataTableFilter,
  DataTable as DataTableUI,
  Heading,
  Hint,
  IconButton,
  useDataTable,
  type DataTableColumnDef,
} from "@medusajs/ui";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { usePageQuery } from "../hooks/use-page-query";
import { Entity } from "../types/data";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

interface DataTableListProps<T extends Entity, R extends PageResponse<T>> {
  name: string;
  description?: string;
  columns: DataTableColumnDef<T, keyof T>[]; // This should be typed according to the DataTable column definitions
  filters: DataTableFilter[];
  actionToolBar?: boolean
  className?: string;
  queryFn: QueryFn<T, R>;
  deleteFn?: (id: string) => Promise<any>;
  onCreateClicked?: () => void;
  onRowClick?: (row: T) => void;
  onRowSelectChange?: (rows: T[]) => void;
}

const DataTable = <T extends Entity, R extends PageResponse<T>>(
  props: DataTableListProps<T, R>,
) => {
  const {
    name,
    description,
    columns,
    filters,
    className,
    actionToolBar,
    queryFn,
    deleteFn,
    onCreateClicked,
    onRowClick,
    onRowSelectChange,
  } = props;

  const { t } = useTranslation()

  const table = useDataTable({
    ...usePageQuery({
      queryKey: name,
      queryFn,
      selectFn: (resp: R | undefined) => {
        return {
          data: resp?.data,
          rowCount: resp?.metadata?.count,
        };
      },
    }),
    columns,
    filters,
    onRowClick: (_, row) => {
      onRowClick?.(row);
    },
  });

  const deleteMutation = useDeleteMutation({
    invalidateKeys: [name],
    errorMessage: 'Failed to delete item',
    successMessage: 'Item deleted successfully',
    deleteFn: (id: string) => deleteFn?.(id) || Promise.resolve(),
  })

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);
    const selectedIds = selectedRows.map((row) => row.id);
    await deleteMutation.mutateAsync(...selectedIds);
  }

  useEffect(() => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);
    onRowSelectChange?.(selectedRows);
  }, [table, onRowSelectChange]);

  return (
    <DataTableUI instance={table} className={className}>
      <DataTableUI.Toolbar className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">
            <span className="capitalize">{name}</span>
          </Heading>
          {description && <Hint>{description}</Hint>}
        </div>
        {onCreateClicked && (
          <Button variant="secondary" size="small" onClick={onCreateClicked}>
            {t("common.create")}
          </Button>
        )}
      </DataTableUI.Toolbar>

      <DataTableUI.Table />
      <DataTableUI.Pagination />
      {actionToolBar &&
        <DataTableBulkActionsToolbar table={table} entityName={name}>
          <IconButton
            size="large"
            className="rounded-none text-ui-fg-error hover:bg-ui-error/10 data-[state=active]:bg-ui-error/20"
            variant="transparent"
            onClick={handleBulkDelete}
          >
            <Trash />
          </IconButton>
        </DataTableBulkActionsToolbar>
      }

    </DataTableUI>
  );
};

export default DataTable;
