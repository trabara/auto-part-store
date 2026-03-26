import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Button, Container, DataTable, Heading, Hint, useDataTable } from "@medusajs/ui";

export default function RolesPage() {
  const table = useDataTable({
    data: [],
    columns: [],
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">Roles</Heading>
            <Hint>
              Manage user roles and their permissions.
            </Hint>
          </div>

          <Button variant="secondary" size="small">
            Create Role
          </Button>
        </DataTable.Toolbar>

        <DataTable.Table />
        {/* <DataTable.Pagination /> */}
      </DataTable>
      {/* <FitmentBulkActionsToolbar table={table} /> */}
    </Container>
  );
}

export const config = defineRouteConfig({
  label: "Roles",
});
