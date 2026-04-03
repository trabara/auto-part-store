import { z } from "@medusajs/framework/zod";
import DataTable from "@repo/admin/components/data-table";
import { sdk } from "@repo/admin/lib/sdk";
import { PageResponse } from "@repo/admin/types/query";
import { memo } from "react";
import { Policy } from "@trabara/core/dtos";
import { RoleSchema } from "@trabara/core/schemas";

type RoleDataTableProps = {
  defaultValues?: Policy[];
  className?: string;
  onChange?: (roleId: string) => void;
};

const schema = RoleSchema.omit({
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

type Schema = z.infer<typeof schema>;

function RoleDataTable({
  defaultValues,
  onChange,
  ...props
}: RoleDataTableProps) {
  const fetchRoles = async (
    signal: AbortSignal,
    params: Record<string, any>,
  ) => {
    return sdk.client.fetch<PageResponse<Schema>>("/admin/rbac/v2/roles", {
      signal,
      method: "GET",
      query: {
        ...(params || {}),
        fields: "id,name,description",
      },
    });
  };

  return (
    <DataTable
      id="Roles"
      schema={schema}
      queryFn={fetchRoles}
      onRowClick={(row) => onChange?.(row.id)}
      {...props}
    />
  );
}

export default memo(RoleDataTable);
