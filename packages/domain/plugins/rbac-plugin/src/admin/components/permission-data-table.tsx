import { z } from "@medusajs/framework/zod";
import DataTable from "@repo/admin/components/data-table";
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CreatePolicyInput, Policy } from "@trabara/core/dtos";
import { PermissionSchema } from "@trabara/core/schemas";

type PermissionDataTableProps = {
  defaultValues?: Policy[];
  className?: string;
  onChange?: (policies: CreatePolicyInput[]) => void;
};

const PermRowSchema = PermissionSchema.omit({
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
  const { t } = useTranslation();

  const selectedIds = useMemo(
    () =>
      defaultValues
        ?.map((p) => p.permission?.id ?? (p as any).permission_id)
        .filter(Boolean) as string[] | undefined,
    [defaultValues],
  );

  return (
    <DataTable
      id="perm"
      schema={PermRowSchema}
      fields={{
        id: {
          hideLabel: true,
        },
        target: {
          label: t("permission.table.target"),
        },
        type: {
          label: t("permission.table.type"),
        },
        kind: {
          label: t("permission.table.kind"),
        },
      }}
      queryFn={fetchPermissions}
      onRowSelectChange={(p) =>
        onChange?.(p.map((p) => ({ permission_id: p.id })))
      }
      selectedIds={selectedIds}
      {...props}
    />
  );
}

export default memo(PermissionDataTable);
