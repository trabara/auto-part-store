import { UseDataTableReturn } from "@medusajs/ui"
import DataTable from "@repo/dashboard/components/data-table"
import { createSchemaDataTableColumnDef } from "@repo/dashboard/helpers/column-def"
import { sdk } from "@repo/dashboard/lib/sdk"
import { PageResponse } from "@repo/dashboard/types/query"
import { useMemo, useRef } from "react"
import { CreatePolicyInput, Permission, PermissionSchema, Policy } from "../../../../modules/rbac/schema"


type PermissionDataTableProps = {
    defaultValues?: Policy[];
    className?: string;
    onChange?: (policies: CreatePolicyInput[]) => void;
}

export default function PermissionDataTable({ defaultValues, onChange, ...props }: PermissionDataTableProps) {


    const columns: any[] = useMemo(() => {
        return createSchemaDataTableColumnDef(
            PermissionSchema.omit({ category: true }),
            ["target", "type", "kind"]
        )
    }, [])

    const fetchPermissions = async (signal: AbortSignal, params: Record<string, any>) => {
        return sdk.client.fetch<PageResponse<Permission>>('/admin/rbac/permissions', {
            signal,
            method: "GET",
            query: {
                ...(params || {}),
            }
        })
    }

    const handleChange = (permissions: Permission[]) => {
        const policies: CreatePolicyInput[] = permissions.map((permission) => ({
            permission_id: permission.id,
            name: 'ALLOW'
        }))
        onChange?.(policies)
    }

    return <DataTable
        name="Permissions"
        columns={columns}
        filters={[]}
        queryFn={fetchPermissions}
        onRowSelectChange={handleChange}
        {...props}
    />
}