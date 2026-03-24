import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCrudContext } from "../../../../context/crud-context";
import { usePaginatedQuery } from "../../../../hooks";
import { MakeBulkActionsToolbar } from "./data-table-bulk-actions";
import { listMakesWithModels } from "../data";
import { useMakeDeleteMutation } from "../hooks/use-delete-mutation";
import { MakeWithModels } from "../types";
import { createMakeColumns } from "./data-table-columns";

const MakeList = () => {
  const { t } = useTranslation();
  const { edit, setIsCreate } = useCrudContext<MakeWithModels>();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery({
    queryKey: "makes",
    queryFn: listMakesWithModels,
    selectFn: (data) => ({ data: data?.makes, rowCount: data?.metadata.count }),
  });

  // Use delete mutation hook
  const [handleDeleteMake] = useMakeDeleteMutation();

  // Create table columns
  const columns = createMakeColumns({
    onEdit: edit,
    onDelete: handleDeleteMake,
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
            <Heading level="h1">{t("make.page.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("make.page.subtitle")}
            </p>
          </div>
          <Button variant="secondary" size="small" onClick={() => setIsCreate(true)}>
            {t("common.create")}
          </Button>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <MakeBulkActionsToolbar table={table} />
    </Container>
  );
};

export default MakeList;
