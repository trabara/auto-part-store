import { Plus } from "@medusajs/icons";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
  usePrompt
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { useDeleteMutation, usePaginatedQuery } from "~/admin/hooks";
import { sdk } from "~/admin/lib/sdk";
import { Model } from "~/modules/fitment/schema";
import { createModelColumns } from "./components/columns";
import { ModelBulkActionsToolbar } from "./components/data-table-bulk-actions";
import { ModelsResponse, ModelWithFitments } from "./types";



const ModelList = () => {
  const navigate = useNavigate();
  const prompt = usePrompt();

  const queryConfig = usePaginatedQuery<ModelsResponse, ModelWithFitments>({
    queryKey: "models",
    fields: "*fitments.id,*make.name",
    selectFn: (data) => ({ data: data?.models, rowCount: data?.metadata.count }),
    queryFn: (params) =>
      sdk.client.fetch(`/admin/models`, {
        query: params,
      }),
  });

  // Delete mutation
  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["models"],
    successMessage: "Model deleted successfully",
    errorMessage: "Failed to delete model",
    deleteFn: (id) =>
      sdk.client.fetch(`/admin/models/${id}`, {
        method: "DELETE",
      }),
  });

  const handleEdit = (model: Model) =>
    navigate(`/fitments/models/${model.id}/edit`);

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
    ...queryConfig,
    columns,
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
            onClick={() => navigate("/fitments/models/create")}
          >
            <Plus className="mr-2" />
            Create Model
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <ModelBulkActionsToolbar table={table} />
    </Container>
  );
};

export default ModelList;
