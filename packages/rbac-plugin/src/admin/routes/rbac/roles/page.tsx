import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { User } from "@medusajs/icons";
import { MedusaPage } from "@repo/dashboard/components/medusa-page";
import {
  CreateRoleSchema,
  RoleSchema,
  UpdateRoleSchema
} from "../../../../modules/authz/schema";
import AssignUsersDrawer from "../components/assign-users-drawer";
import PermissionDataTable from "../components/permission-data-table";
import { COMMON_FIELDS } from "./constant";

const RoleListSchema = RoleSchema.extend({ members: z.array(z.object({ user_id: z.string() })) });


export default function RolesPage() {
  return (
    <MedusaPage
      id="role"
      path="/admin/rbac/v2/roles"
      title="Roles"
      description="Manage user roles and their permissions"
      schema={RoleListSchema}
      fields={{
        ...COMMON_FIELDS,
        is_default: {
          ...COMMON_FIELDS.is_default,
          cell: (info) => <span>{info.getValue() ? "Yes" : "No"}</span>,
        },
      }}
      rowActions={[
        {
          id: "assign-user",
          label: "Assign Users",
          icon: <User />,
          render: (role) => <AssignUsersDrawer roleId={role.id} members={role.members} />,
        },
      ]}
      create={{
        id: "role",
        schema: CreateRoleSchema,
        fields: {
          ...COMMON_FIELDS,
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