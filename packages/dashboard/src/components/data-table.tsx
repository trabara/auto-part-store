import { PageResponse, QueryFn } from "@/types/query";
import {
  Button,
  DataTableFilter,
  DataTable as DataTableUI,
  Heading,
  Hint,
  useDataTable,
  type DataTableColumnDef
} from "@medusajs/ui";
import { useEffect } from "react";
import { usePageQuery } from "../hooks/use-page-query";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

interface DataTableListProps<T, R extends PageResponse<T>> {
  name: string;
  columns: DataTableColumnDef<T, any>[]; // This should be typed according to the DataTable column definitions
  filters: DataTableFilter[];
  className?: string;
  queryFn: QueryFn<T, R>;
  onCreateClicked?: () => void;
  onRowClick?: (row: T) => void;
  onRowSelectChange?: (rows: T[]) => void;
}

const DataTable = <T extends { id: string }, R extends PageResponse<T>>(
  props: DataTableListProps<T, R>,
) => {

  const {
    name,
    columns,
    filters,
    className,
    queryFn,
    onCreateClicked,
    onRowClick,
    onRowSelectChange,
  } = props;

  // Use paginated query hook
  const queryConfig = usePageQuery({
    queryKey: name,
    queryFn,
    selectFn: (resp: R | undefined) => {
      return {
        data: resp?.data,
        rowCount: resp?.metadata?.count
      }
    }
  });

  const table = useDataTable({
    ...queryConfig,
    columns,
    filters,
    onRowClick: (_, row) => {
      onRowClick?.(row);
    },
  });

  useEffect(() => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map(row => row.original)
    onRowSelectChange?.(selectedRows)
  }, [table])

  return (
    <DataTableUI instance={table} className={className}>
      <DataTableUI.Toolbar
        className="flex items-center justify-between px-6 py-4"
      >
        <div>
          <Heading level="h1">
            <span className="capitalize">{name}</span>
          </Heading>
          <Hint></Hint>
        </div>
        {onCreateClicked && (
          <Button variant="secondary" size="small" onClick={onCreateClicked}>
            Create
          </Button>
        )}
      </DataTableUI.Toolbar>

      <DataTableUI.Table />
      <DataTableUI.Pagination />

      <DataTableBulkActionsToolbar table={table} entityName={name}>
        <div></div>
      </DataTableBulkActionsToolbar>
    </DataTableUI>
  );
}

export default DataTable;
