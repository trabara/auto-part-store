import { z } from "@medusajs/framework/zod"
import DataTable from "@repo/dashboard/components/data-table"
import { createZodDataTableColumnDef } from "@repo/dashboard/helpers/zod-column-def"
import { sdk } from "@repo/dashboard/lib/sdk"
import { PageResponse } from "@repo/dashboard/types/query"
import { memo, useCallback, useMemo } from "react"
import { CreatePolicyInput, PermissionSchema, Policy } from "../../../../modules/rbac/schema"


type PermissionDataTableProps = {
    defaultValues?: Policy[];
    className?: string;
    onChange?: (policies: CreatePolicyInput[]) => void;
}

const colsSchema = PermissionSchema.omit({ category: true, created_at: true, updated_at: true, deleted_at: true })

type ColsSchema = z.infer<typeof colsSchema>

function PermissionDataTable({ defaultValues, onChange, ...props }: PermissionDataTableProps) {


    const columns = useMemo(() => {
        return createZodDataTableColumnDef({
            schema: colsSchema,
            fields: {
                id: {
                    label: "ID",
                },
                target: {
                    label: "Resource",
                },
                type: {
                    label: "Type",
                },
                kind: {
                    label: "Kind",
                },
            }
        })
    }, [])

    const fetchPermissions = async (signal: AbortSignal, params: Record<string, any>) => {
        return sdk.client.fetch<PageResponse<ColsSchema>>('/admin/rbac/permissions', {
            signal,
            method: "GET",
            query: {
                ...(params || {}),
                fields: 'id,target,type,kind',
            }
        })
    }

    const handleChange = useCallback((perms: ColsSchema[]) => {
        const policies: CreatePolicyInput[] = perms.map((permission) => ({
            permission_id: permission.id,
            name: 'ALLOW'
        }))
        onChange?.(policies)
    }, [onChange])

    return <DataTable
        name="Permissions"
        columns={columns as any}
        filters={[]}
        queryFn={fetchPermissions}
        onRowSelectChange={handleChange}
        {...props}
    />
}

export default memo(PermissionDataTable)