import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useCrudContext } from "../../../../context/crud-context";
import { usePaginatedQuery } from "../../../../hooks";
import { listModelsWithFitments } from "../data";
import { useModelDeleteMutation } from "../hooks/use-model-delete";
import { ModelWithFitments } from "../types";
import { ModelBulkActionsToolbar } from "./data-table-bulk-actions";
import { createModelColumns } from "./data-table-columns";

const ModelList = () => {
  const { t } = useTranslation();
  const { edit, setIsCreate } = useCrudContext<ModelWithFitments>();

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

  const columns = createModelColumns({
    onEdit: edit,
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
          <Button variant="secondary" size="small" onClick={() => setIsCreate(true)}>
            {t("common.create")}
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
