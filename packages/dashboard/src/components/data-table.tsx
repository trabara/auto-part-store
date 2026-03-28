import { PageResponse, QueryFn } from "@/types/query";
import {
  Button,
  DataTable,
  DataTableFilter,
  Heading,
  Hint,
  useDataTable,
  type DataTableColumnDef
} from "@medusajs/ui";
import { usePageQuery } from "../hooks/use-page-query";
import { DataTableBulkActionsToolbar } from "./bulk-actions-toolbar";

interface DataTableListProps<T, Response extends PageResponse<T>> {
  name: string;
  columns: DataTableColumnDef<T, any>[]; // This should be typed according to the DataTable column definitions
  filters: DataTableFilter[];
  queryFn: QueryFn<T, Response>;
  onCreateClicked?: () => void;
  className?: string;
  onRowClick?: (row: T) => void;
}

const DataTableList = <T extends { id: string }, R extends PageResponse<T>>({
  name,
  columns,
  filters,
  className,
  queryFn,
  onCreateClicked,
  onRowClick,
}: DataTableListProps<T, R>) => {
  // Use paginated query hook
  const queryConfig = usePageQuery({
    queryKey: name,
    queryFn,
    selectFn: (response: R | undefined) => {
      return {
        data: response?.data,
        rowCount: response?.metadata?.count
      }
    }
  });

  const table = useDataTable({
    ...queryConfig,
    columns,
    filters,
    onRowClick: (_, row) => {
      onRowClick?.(row);
    }
  });

  return (
    <DataTable instance={table} className={className}>
      <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">
            {name}
          </Heading>
          <Hint></Hint>
        </div>
        {onCreateClicked && (
          <Button variant="secondary" size="small" onClick={onCreateClicked}>
            Create
          </Button>
        )}
      </DataTable.Toolbar>
      <DataTable.Table />
      <DataTable.Pagination />

      <DataTableBulkActionsToolbar table={table} entityName={name}>
        <div></div>
      </DataTableBulkActionsToolbar>
    </DataTable>
  );
};

export default DataTableList;
