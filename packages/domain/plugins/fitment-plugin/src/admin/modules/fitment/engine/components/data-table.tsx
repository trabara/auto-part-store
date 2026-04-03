import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Engine } from "@trabara/core/dtos";
import { useCrudContext } from "../../../../context/crud-context";
import { usePaginatedQuery } from "../../../../hooks";
import { listEngines } from "../data";
import { useEngineDeleteMutation } from "../hooks/use-engine-delete";
import { EngineBulkActionsToolbar } from "./data-table-bulk-actions";
import { createEngineColumns } from "./data-table-columns";

const EngineList = () => {
  const { t } = useTranslation();
  const { edit, setIsCreate } = useCrudContext<Engine>();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery({
    queryKey: "engines",
    queryFn: listEngines,
    selectFn: (data) => ({
      data: data?.engines,
      rowCount: data?.metadata.count,
    }),
  });

  // Use delete mutation hook
  const [deleteEngineHandler] = useEngineDeleteMutation();

  // Create table columns
  const columns = createEngineColumns({
    onEdit: edit,
    onDelete: deleteEngineHandler,
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
            <Heading level="h1">{t("engine.page.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("engine.page.subtitle")}
            </p>
          </div>

          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsCreate(true)}
          >
            {t("common.create")}
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
