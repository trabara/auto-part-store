import { createDataTableColumnHelper, Switch } from "@medusajs/ui"
import DataTableList from "@repo/dashboard/components/data-table"
import { createSchemaDataTableColumnDef } from "@repo/dashboard/helpers/column-def"
import { sdk } from "@repo/dashboard/lib/sdk"
import { PageResponse } from "@repo/dashboard/types/query"
import { useMemo, useState } from "react"
import { CreatePolicyInput, Permission, PermissionSchema, Policy } from "../../../../../modules/rbac/schema"

const columnHelper = createDataTableColumnHelper<Permission>()

type PoliciesListProps = {
    defaultValues?: Policy[],
    onChange?: (policies: CreatePolicyInput[]) => void,
    className?: string
}

export default function PoliciesList({ defaultValues, onChange, ...props }: PoliciesListProps) {

    const [policies, setPolicies] = useState<CreatePolicyInput[]>(() => {
        return defaultValues?.map(p => ({
            name: p.name,
            permission_id: p.permission.id
        })) || []
    })

    const handlePolicyChange = (permissionId: string, allow: boolean) => {
        const updatedPolicies = [...policies]
        if (allow) {
            updatedPolicies.push({ permission_id: permissionId, name: "ALLOW" })
        } else {
            const index = updatedPolicies.findIndex(p => p.permission_id === permissionId)
            if (index !== -1) {
                updatedPolicies.splice(index, 1)
            }
        }
        setPolicies(updatedPolicies)
        onChange?.(updatedPolicies)
    }

    const permissionColumns: any[] = useMemo(() => {
        const columns = createSchemaDataTableColumnDef(
            PermissionSchema.omit({ category: true }),
            ["target", "type", "kind"]
        )

        return [
            ...columns,
            columnHelper.display({
                id: "actions",
                header: "Allow",
                cell: ({ row }) => {
                    return <Switch onCheckedChange={(checked) => {
                        handlePolicyChange(row.original.id, checked)
                    }} />
                }
            })
        ]
    }, [])

    const fetchPermissions = async (signal: AbortSignal, params: Record<string, any>) => {
        const response = await sdk.client.fetch<PageResponse<Permission>>('/admin/rbac/permissions', {
            signal,
            method: "GET",
            query: {
                ...(params || {}),
            }
        })
        return response
    }

    return <DataTableList<Permission, PageResponse<Permission>>
        columns={permissionColumns}
        filters={[]}
        name="Permissions"
        queryFn={fetchPermissions}
        {...props}
    />
}