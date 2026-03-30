import { z } from "@medusajs/framework/zod"
import DataTable from "@repo/dashboard/components/data-table"
import { sdk } from "@repo/dashboard/lib/sdk"
import { PageResponse } from "@repo/dashboard/types/query"
import { memo } from "react"
import { Policy, RoleSchema } from "../../../../modules/rbac-v2/schema"


type RoleDataTableProps = {
    defaultValues?: Policy[];
    className?: string;
    onChange?: (roleId: string) => void;
}

const schema = RoleSchema.omit({ created_at: true, updated_at: true, deleted_at: true, policies: true })
type Schema = z.infer<typeof schema>

function RoleDataTable({ defaultValues, onChange, ...props }: RoleDataTableProps) {

    const fetchRoles = async (signal: AbortSignal, params: Record<string, any>) => {
        return sdk.client.fetch<PageResponse<Schema>>('/admin/rbac/v2/roles', {
            signal,
            method: "GET",
            query: {
                ...(params || {}),
                fields: 'id,name,description',
            }
        })
    }

    return <DataTable
        name="Permissions"
        schema={schema}
        queryFn={fetchRoles}
        onRowClick={(row) => onChange?.(row.id)}
        {...props}
    />
}

export default memo(RoleDataTable)