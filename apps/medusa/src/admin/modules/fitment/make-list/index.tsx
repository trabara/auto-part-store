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
import { sdk } from "~/lib/sdk";
import { usePaginatedQuery, useDeleteMutation } from "~/hooks";
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
  const prompt = usePrompt();

  // Use paginated query hook
  const { data, isLoading, pagination, setPagination, sorting, setSorting } =
    usePaginatedQuery<MakesResponse>({
      queryKey: "makes",
      fields: "*models",
      queryFn: (params) => sdk.client.fetch(`/admin/makes`, { query: params }),
    });

  // Use delete mutation hook
  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["makes"],
    successMessage: "Make deleted successfully",
    errorMessage: "Failed to delete make",
    deleteFn: (id) =>
      sdk.client.fetch(`/admin/makes/${id}`, { method: "DELETE" }),
  });

  // Action handlers
  const handleEdit = (make: Make) =>
    navigate(`/fitments/makes/${make.id}/edit`);

  const handleDelete = async (make: Make) => {
    const confirmed = await prompt({
      title: "Delete Make",
      description: `Are you sure you want to delete "${make.name}"? This will also delete all associated models and fitments.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) deleteMutation.mutate(make.id);
  };

  // Create table columns
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
            onClick={() => navigate("/fitments/makes/create")}
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
