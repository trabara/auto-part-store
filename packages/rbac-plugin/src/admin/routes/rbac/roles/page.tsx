import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { User } from "@medusajs/icons";
import { MedusaPage } from "@repo/dashboard/components/medusa-page";
import {
  CreateRoleSchema,
  MemberSchema,
  RoleSchema,
  UpdateRoleSchema,
} from "../../../../modules/authz/schema";
import AssignUsersDrawer from "../components/assign-users-drawer";
import PermDataTable from "../components/perm-data-table";

const RoleListSchema = RoleSchema.extend({ members: z.array(MemberSchema) });

export default function RolesPage() {

  return (
    <MedusaPage
      name="roles"
      path="/admin/rbac/v2/roles"
      description="Manage user roles and their permissions"
      schema={RoleListSchema}
      fields={{
        name: {
          label: "Name",
          description: "The name of the role",
        },
        description: {
          label: "Description",
          description: "A brief description of the role",
        },
        is_default: {
          label: "Default",
          description: "Users with this role will be assigned it by default",
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
      toolbarActions={[]}
      create={{
        schema: CreateRoleSchema,
        fields: {
          name: {
            label: "Name",
            description: "The name of the role",
          },
          description: {
            label: "Description",
            description: "A brief description of the role",
          },
          is_default: {
            label: "Default",
            description:
              "Users with this role will be assigned it by default",
          },
          policies: {
            hideLabel: true,
            render: ({ onChange }) => (
              <PermDataTable
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
            schema: CreateRoleSchema.omit({ policies: true }),
          },
          {
            id: "permissions",
            label: "Permissions",
            header: false,
            icon: <User />,
            schema: CreateRoleSchema.pick({ policies: true }),
          },
        ],
      }}
      edit={{
        schema: UpdateRoleSchema,
      }}
    />
  );
}


export const config = defineRouteConfig({
  label: "Roles",
});