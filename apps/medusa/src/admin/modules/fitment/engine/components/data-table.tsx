import { Plus } from "@medusajs/icons";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable
} from "@medusajs/ui";
import { Link, useNavigate } from "react-router-dom";
import { usePaginatedQuery } from "~/admin/hooks";
import { Engine } from "~/modules/fitment/schema";
import { listEngines } from "../data";
import { useEngineDeleteMutation } from "../hooks/use-engine-delete";
import { EngineBulkActionsToolbar } from "./data-table-bulk-actions";
import { createEngineColumns } from "./data-table-columns";


const EngineList = () => {
  const navigate = useNavigate();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery({
    queryKey: "engines",
    queryFn: listEngines,
    selectFn: (data) => ({ data: data?.engines, rowCount: data?.metadata.count }),
  });

  // Use delete mutation hook
  const [deleteEngineHandler] = useEngineDeleteMutation();


  // Action handlers
  const handleEdit = (engine: Engine) =>
    navigate(`/fitments/engines/${engine.id}/edit`);


  // Create table columns
  const columns = createEngineColumns({
    onEdit: handleEdit,
    onDelete: deleteEngineHandler,
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
            <Heading level="h1">Engines</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              Manage vehicle engines and specifications
            </p>
          </div>

          <Button variant="primary" asChild>
            <Link to="/fitments/engines/create">
              <Plus className="mr-2" />
              Create Engine
            </Link>
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <EngineBulkActionsToolbar table={table} />
    </Container>
  );
};

export default EngineList;
