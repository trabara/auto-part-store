import { Plus } from "@medusajs/icons";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
  usePrompt,
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { useDeleteMutation, usePaginatedQuery } from "~/hooks";
import { sdk } from "~/lib/sdk";
import { Engine } from "~/modules/fitment/schema";
import { createEngineColumns } from "./components/columns";
import { EngineBulkActionsToolbar } from "./components/data-table-bulk-actions";
import { AdminEngineListResponse } from "./types";


const EngineList = () => {
  const navigate = useNavigate();
  const prompt = usePrompt();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery<AdminEngineListResponse, Engine>({
    queryKey: "engines",
    selectFn: (data) => data?.engines,
    queryFn: (params) =>
      sdk.client.fetch(`/admin/engines`, { query: params }),
  });

  // Use delete mutation hook
  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["engines"],
    successMessage: "Engine deleted successfully",
    errorMessage: "Failed to delete engine",
    deleteFn: (id) =>
      sdk.client.fetch(`/admin/engines/${id}`, { method: "DELETE" }),
  });

  // Action handlers
  const handleEdit = (engine: Engine) =>
    navigate(`/fitments/engines/${engine.id}/edit`);

  const handleDelete = async (engine: Engine) => {
    const engineDescription = `${engine.size}L ${engine.type} ${engine.fuel}`;
    const confirmed = await prompt({
      title: "Delete Engine",
      description: `Are you sure you want to delete "${engineDescription}"? This will also delete all associated fitments.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) deleteMutation.mutate(engine.id);
  };

  // Create table columns
  const columns = createEngineColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
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
          <Button
            variant="secondary"
            size="base"
            onClick={() => navigate("/fitments/engines/create")}
          >
            <Plus className="mr-2" />
            Create Engine
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
