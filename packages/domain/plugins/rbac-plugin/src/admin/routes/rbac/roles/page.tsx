import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { User } from "@medusajs/icons";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { CreateRoleSchema, UpdateRoleSchema } from "@trabara/core/validations";
import { RoleSchema } from "@trabara/core/schemas";
import AssignUsersDrawer from "../components/assign-users-drawer";
import PermissionDataTable from "../components/permission-data-table";

const RoleListSchema = RoleSchema.extend({
  members: z.array(z.object({ user_id: z.string() })),
});

export const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof RoleListSchema>> =
  {
    name: {
      label: "Name",
      description: "The name of the role",
      isFiltrable: true,
    },
    description: {
      label: "Description",
      description: "A brief description of the role",
      isFiltrable: true,
    },
  };

export default function RolesPage() {
  return (
    <MedusaPage
      id="role"
      path="/admin/rbac/v2/roles"
      title="Roles"
      description="Manage user roles and their permissions"
      schema={RoleListSchema}
      fields={{
        ...BASE_FIELDS,
      }}
      rowActions={[
        {
          id: "assign-user",
          label: "Assign Users",
          icon: <User />,
          render: (role) => (
            <AssignUsersDrawer roleId={role.id} members={role.members} />
          ),
        },
      ]}
      create={{
        id: "role",
        schema: CreateRoleSchema,
        fields: {
          ...BASE_FIELDS,
          policies: {
            hideLabel: true,
            render: ({ onChange }) => (
              <PermissionDataTable
                className="absolute inset-0"
                onChange={onChange}
              />
            ),
          },
        },
        steps: [
          {
            id: "general",
            label: "General",
            icon: <User />,
            schema: CreateRoleSchema.omit({ permissions: true }),
          },
          {
            id: "permissions",
            label: "Permissions",
            header: false,
            icon: <User />,
            schema: CreateRoleSchema.pick({ permissions: true }),
          },
        ],
      }}
      edit={{
        schema: UpdateRoleSchema,
        id: "role",
      }}
    />
  );
}

export const handle = {
  breadcrumb: () => "Roles",
};

export const config = defineRouteConfig({
  label: "Roles",
});
