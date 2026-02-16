import { Plus } from "@medusajs/icons";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sdk } from "~/lib/sdk";
import { Make, Model } from "~/modules/fitment/schema";
import { createMakeColumns } from "./columns";

export type MakeWithModels = Make & { models: Model[] };


type MakesResponse = {
  makes: MakeWithModels[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};

const MakeList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  });

  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);

  // Fetch makes
  const { data, isLoading } = useQuery<MakesResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/makes`, {
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          fields: "*models",
          order: sorting
            ? `${sorting.desc ? "-" : ""}${sorting.id}`
            : undefined,
        },
      }),
    queryKey: ["makes", pagination, sorting],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/makes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Make deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["makes"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete make");
    },
  });

  const handleEdit = (make: Make) => {
    navigate(`/fitments/makes/${make.id}/edit`);
  };

  const handleDelete = async (make: Make) => {
    const confirmed = await prompt({
      title: "Delete Make",
      description: `Are you sure you want to delete "${make.name}"? This will also delete all associated models and fitments.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      deleteMutation.mutate(make.id);
    }
  };

  const columns = createMakeColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const table = useDataTable({
    columns,
    data: data?.makes || [],
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
            <Heading level="h1">Makes</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              Manage vehicle makes and manufacturers
            </p>
          </div>
          <Button
            variant="secondary"
            size="base"
            onClick={() => navigate("/makes/create")}
          >
            <Plus className="mr-2" />
            Create Make
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export default MakeList;
