import { defineRouteConfig } from "@medusajs/admin-sdk";
import { MedusaPage } from '@repo/dashboard/components/medusa-page';
import { sdk } from '@repo/dashboard/lib/sdk';
import { PageQueryParams, PageResponse } from '@repo/dashboard/types/query';
import { User } from "lucide-react";
import { CreateRoleInput, CreateRoleSchema, Role, RoleSchema, UpdateRoleInput, UpdateRoleSchema } from '../../../../modules/rbac/schema';
import PermissionDataTable from "../components/permission-data-table";

export default function RolesPage() {

  const listRoles = (signal: AbortSignal, params?: PageQueryParams) =>
    sdk.client.fetch<PageResponse<Role>>("/admin/rbac/roles", {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: 'id,name,description,is_default,created_at',
      },
    })

  const createRole = (data: CreateRoleInput) =>
    sdk.client.fetch("/admin/rbac/roles", { method: "POST", body: data })

  const updateRole = (data: UpdateRoleInput) =>
    sdk.client.fetch("/admin/rbac/roles", { method: "PATCH", body: data })


  return (
    <MedusaPage
      name="roles"
      description="Manage user roles and their permissions"
      schema={RoleSchema.omit({ policies: true })}
      queryFn={listRoles}
      fields={{
        name: {
          label: "Name",
          description: "The name of the role",
        },
        description: {
          label: "Description",
          description: "A brief description of the role"
        },
        is_default: {
          label: "Default",
          description: "Users with this role will be assigned it by default",
          cell: ({ getValue }) => <span>{getValue() ? "Yes" : "No"}</span>
        },
        
      }}
      create={{
        mutateFn: (data) => createRole(data),
        schema: CreateRoleSchema,
        fields: {
          policies: {
            hideLabel: true,
            render: ({ onChange }) => <PermissionDataTable
              className="absolute inset-0"
              onChange={onChange}
            />
          },
        },
        steps: [
          {
            id: "general",
            label: "General",
            icon: <User />,
            schema: CreateRoleSchema.omit({ policies: true })
          },
          {
            id: "permissions",
            label: "Permissions",
            header: false,
            icon: <User />,
            schema: CreateRoleSchema.pick({ policies: true })
          }
        ]
      }}
      edit={{
        schema: UpdateRoleSchema,
        mutateFn: updateRole
      }}
    />
  );
}

export const config = defineRouteConfig({
  label: "Roles",
});
