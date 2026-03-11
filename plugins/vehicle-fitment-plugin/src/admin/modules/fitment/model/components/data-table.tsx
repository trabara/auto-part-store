import { Plus } from "@medusajs/icons";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePaginatedQuery } from "../../../../hooks";
import { Model } from "../../../../../modules/fitment/schema";
import { listModelsWithFitments } from "../data";
import { useModelDeleteMutation } from "../hooks/use-mode-delete";
import { ModelBulkActionsToolbar } from "./data-table-bulk-actions";
import { createModelColumns } from "./data-table-columns";

const ModelList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const queryConfig = usePaginatedQuery({
    queryKey: "models",
    selectFn: (data) => ({
      data: data?.models,
      rowCount: data?.metadata.count,
    }),
    queryFn: listModelsWithFitments,
  });

  // Delete mutation
  const [deleteHandler] = useModelDeleteMutation();

  const handleEdit = (model: Model) =>
    navigate(`/fitments/models/${model.id}/edit`);

  const columns = createModelColumns({
    onEdit: handleEdit,
    onDelete: deleteHandler,
    t,
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
            <Heading level="h1">{t("model.page.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("model.page.subtitle")}
            </p>
          </div>
          <Button variant="secondary" size="small" asChild>
            <Link to="/fitments/models/create">
              <Plus className="mr-2" />
              {t("common.create")}
            </Link>
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
