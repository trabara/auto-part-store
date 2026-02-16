import { Plus } from "@medusajs/icons";
import {
  Button,
  Container,
  DataTable,
  Heading,
  toast,
  useDataTable,
  usePrompt,
  type DataTableFilteringState,
  type DataTablePaginationState,
  type DataTableSortingState,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sdk } from "~/lib/sdk";
import { Fitment, Model } from "~/modules/fitment/schema";
import { createModelColumns } from "./columns";
import modelFilters from "./filters";

export type ModelWithFitments = Model & {
  fitments: Fitment[];
};

type ModelsResponse = {
  models: ModelWithFitments[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};

const ModelList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  });

  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});

  // Build filter query
  const filterValues = Object.entries(filtering).reduce(
    (acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  // Fetch models
  const { data, isLoading } = useQuery<ModelsResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/models`, {
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          fields: "*make,*fitments",
          order: sorting
            ? `${sorting.desc ? "-" : ""}${sorting.id}`
            : undefined,
          filters: filterValues,
        },
      }),
    queryKey: ["models", pagination, sorting, filterValues],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/models/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Model deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete model");
    },
  });

  const handleEdit = (model: Model) => {
    navigate(`/fitments/models/${model.id}/edit`);
  };

  const handleDelete = async (model: Model) => {
    const confirmed = await prompt({
      title: "Delete Model",
      description: `Are you sure you want to delete "${model.name}"? This will also delete all associated fitments.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      deleteMutation.mutate(model.id);
    }
  };

  const columns = createModelColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const table = useDataTable({
    columns,
    data: data?.models || [],
    filters: modelFilters,
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
    filtering: {
      state: filtering,
      onFilteringChange: setFiltering,
    },
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Models</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              Manage vehicle models by manufacturer
            </p>
          </div>
          <Button
            variant="secondary"
            size="base"
            onClick={() => navigate("/models/create")}
          >
            <Plus className="mr-2" />
            Create Model
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export default ModelList;
