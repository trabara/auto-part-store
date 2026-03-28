import { defineRouteConfig } from "@medusajs/admin-sdk";
import { MedusaPage } from '@repo/dashboard/components/medusa-page';
import { sdk } from '@repo/dashboard/lib/sdk';
import { PageResponse } from '@repo/dashboard/types/query';
import { User } from 'lucide-react';
import { CreateRoleSchema, Role, RoleSchema, UpdateRoleSchema } from '../../../../modules/rbac/schema';
import PoliciesList from "./components/policies-list";

export default function RolesPage() {
  const listRoles = async (signal: AbortSignal, params: Record<string, any>) => {
    const response = await sdk.client.fetch<PageResponse<Role>>("/admin/rbac/roles", { method: "GET", signal })
    return response
  }
  const createRole = async (data: any) => {
    await sdk.client.fetch("/admin/rbac/roles", { method: "POST", body: data })
  }
  const updateRole = async (data: any) => {
    await sdk.client.fetch("/admin/rbac/roles", { method: "PUT", body: data })
  }
  const deleteRole = async (data: any) => {
    await sdk.client.fetch("/admin/rbac/roles", { method: "DELETE", body: data })
  }
  return (
    <MedusaPage<Role>
      name="role"
      fields={{
        name: {
          label: "Name",
          description: "The name of the role"
        },
        description: {
          label: "Description",
          description: "A brief description of the role"
        },
        is_default: {
          label: "Default Role",
          description: "Users with this role will be assigned it by default",
        },
      }}
      config={{
        list: {
          schema: RoleSchema.omit({ policies: true }),
          fetcher: listRoles
        },
        create: {
          schema: CreateRoleSchema,
          fetcher: createRole,
          fields: {
            policies: {
              hideLabel: true,
              render: ({ onChange }: any) => <PoliciesList className="absolute inset-0" onChange={onChange} />
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

        },
        update: {
          schema: UpdateRoleSchema,
          fetcher: updateRole
        },
        delete: {
          fetcher: deleteRole
        }
      }}
    />
  );
}

export const config = defineRouteConfig({
  label: "Roles",
});
