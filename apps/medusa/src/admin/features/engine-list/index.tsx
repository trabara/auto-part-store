import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Container,
  DataTable,
  Heading,
  toast,
  useDataTable,
  usePrompt,
  type DataTablePaginationState,
  type DataTableSortingState,
} from "@medusajs/ui";
import { Plus } from "@medusajs/icons";
import { sdk } from "~/lib/sdk";
import { createEngineColumns } from "./columns";
import { Engine } from "~/modules/fitment/schema";

type EnginesResponse = {
  engines: Engine[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};

const EngineList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  });

  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);

  // Fetch engines
  const { data, isLoading } = useQuery<EnginesResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/engines`, {
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          order: sorting
            ? `${sorting.desc ? "-" : ""}${sorting.id}`
            : undefined,
        },
      }),
    queryKey: ["engines", pagination, sorting],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/engines/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Engine deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["engines"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete engine");
    },
  });

  const handleEdit = (engine: Engine) => {
    navigate(`/fitments/engines/${engine.id}/edit`);
  };

  const handleDelete = async (engine: Engine) => {
    const engineDescription = `${engine.size}L ${engine.type} ${engine.fuel}`;
    const confirmed = await prompt({
      title: "Delete Engine",
      description: `Are you sure you want to delete "${engineDescription}"? This will also delete all associated fitments.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      deleteMutation.mutate(engine.id);
    }
  };

  const columns = createEngineColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const table = useDataTable({
    columns,
    data: data?.engines || [],
    getRowId: (row) => row.id,
    rowCount: data?.metadata.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    sorting: {
      state: sorting,
      onSortingChange: setSorting,
    },
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
            onClick={() => navigate("/engines/create")}
          >
            <Plus className="mr-2" />
            Create Engine
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export default EngineList;
