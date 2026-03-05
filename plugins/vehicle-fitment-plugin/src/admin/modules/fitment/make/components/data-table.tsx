import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable
} from "@medusajs/ui";
import { Link, useNavigate } from "react-router-dom";
import { usePaginatedQuery } from "../../../../hooks";
import { MakeBulkActionsToolbar } from "../components/data-table-bulk-actions";
import { listMakesWithModels } from "../data";
import { useMakeDeleteMutation } from "../hooks/use-delete-mutation";
import { MakeWithModels } from "../types";
import { createMakeColumns } from "./data-table-columns";



const MakeList = () => {
  const navigate = useNavigate();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery({
    queryKey: "makes",
    queryFn: listMakesWithModels,
    selectFn: (data) => ({ data: data?.makes, rowCount: data?.metadata.count }),
  });

  // Use delete mutation hook
  const [handleDeleteMake] = useMakeDeleteMutation();

  // Action handlers
  const handleEdit = (make: MakeWithModels) =>
    navigate(`/fitments/makes/${make.id}/edit`);

  // Create table columns
  const columns = createMakeColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteMake,
  });

  const table = useDataTable({
    ...queryConfig,
    columns,
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Makes</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              Manage vehicle makes and manufacturers
            </p>
          </div>
          <Button
            variant="secondary"
            size="small"
            asChild
          >
            <Link to="/fitments/makes/create">
              Create
            </Link>
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <MakeBulkActionsToolbar table={table} />
    </Container>
  );
};

export default MakeList;
