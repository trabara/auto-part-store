import { defineRouteConfig } from "@medusajs/admin-sdk";
import { User } from "@medusajs/icons";
import { MedusaPage } from '@repo/dashboard/components/medusa-page';
import { useState } from "react";
import { Fragment } from "react/jsx-runtime";
import {
  CreateRoleSchema,
  RoleSchema,
  UpdateRoleSchema
} from '../../../../modules/rbac-v2/schema';
import AssignUsersDrawer from "../components/assign-users-drawer";
import PermDataTable from "../components/perm-data-table";

const RoleListSchema = RoleSchema.omit({ policies: true })

export default function RolesPage() {
  const [assignableRoleId, setAssignableRoleId] = useState<string | null>(null);

  return (
    <Fragment>
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
            description: "A brief description of the role"
          },
          is_default: {
            label: "Default",
            description: "Users with this role will be assigned it by default",
            cell: (info) => <span>{info.getValue() ? "Yes" : "No"}</span>
          },
        }}
        rowActions={[
          {
            id: "assign-user",
            label: "Assign Users",
            icon: <User />,
            onClick: (role) => {
              setAssignableRoleId(role.id);
            }
          }
        ]}
        toolbarActions={[

        ]}
        create={{
          schema: CreateRoleSchema,
          fields: {
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
            },
            policies: {
              hideLabel: true,
              render: ({ onChange }) => <PermDataTable
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
        }}
      />
      {assignableRoleId && (
        <AssignUsersDrawer
          roleId={assignableRoleId}
          open={!!assignableRoleId}
          onOpenChange={(open) => {
            if (!open) {
              setAssignableRoleId(null);
            }
          }}
        />
      )}
    </Fragment>
  );
}

export const config = defineRouteConfig({
  label: "Roles",
});
