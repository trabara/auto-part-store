import { z } from "@medusajs/framework/zod";
import DataTable from "@repo/dashboard/components/data-table";
import { sdk } from "@repo/dashboard/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/dashboard/types/query";
import { memo, useCallback } from "react";
import {
  CreatePolicyInput,
  PermissionSchema,
  Policy,
} from "../../../../modules/authz/schema";

type PermissionDataTableProps = {
  defaultValues?: Policy[];
  className?: string;
  onChange?: (policies: CreatePolicyInput[]) => void;
};

const PermRowSchema = PermissionSchema.omit({
  category: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});
type PermRow = z.infer<typeof PermRowSchema>;

const fetchPermissions = async (
  signal: AbortSignal,
  params?: PageQueryParams,
) => {
  return sdk.client.fetch<PageResponse<PermRow>>("/admin/rbac/v2/permissions", {
    signal,
    method: "GET",
    query: {
      ...(params || {}),
      fields: "id,target,type,kind",
    },
  });
};

function PermissionDataTable({
  defaultValues,
  onChange,
  ...props
}: PermissionDataTableProps) {
  const handleChange = useCallback(
    (row: PermRow[]) => {
      const policies: CreatePolicyInput[] = row.map((p) => ({
        permission_id: p.id,
        name: "ALLOW",
      }));
      onChange?.(policies);
    },
    [onChange],
  );

  return (
    <DataTable
      name="Permissions"
      schema={PermRowSchema}
      fields={{
        id: {
          hideLabel: true,
        },
        target: {
          label: "Resource",
        },
        type: {
          label: "Action",
        },
        kind: {
          label: "Kind",
        },
      }}
      queryFn={fetchPermissions}
      onRowSelectChange={handleChange}
      {...props}
    />
  );
}

export default memo(PermissionDataTable);
