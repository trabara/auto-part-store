import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { User } from "@medusajs/icons";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { CreateRoleSchema, UpdateRoleSchema } from "@trabara/core/validations";
import { RoleSchema } from "@trabara/core/schemas";
import { useTranslation } from "react-i18next";
import AssignUsersDrawer from "../components/assign-users-drawer";
import PermissionDataTable from "../components/permission-data-table";

const RoleListSchema = RoleSchema.extend({
  members: z.array(z.object({ user_id: z.string() })),
});

export default function RolesPage() {
  const { t } = useTranslation();

  const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof RoleListSchema>> = {
    name: {
      label: t("role.field.name.label"),
      description: t("role.field.name.description"),
      isFiltrable: true,
    },
    description: {
      label: t("role.field.description.label"),
      description: t("role.field.description.description"),
      isFiltrable: true,
    },
  };

  return (
    <MedusaPage
      id="role"
      path="/admin/rbac/v2/roles"
      title={t("role.page.title")}
      description={t("role.page.subtitle")}
      schema={RoleListSchema}
      fields={{
        ...BASE_FIELDS,
      }}
      rowActions={[
        {
          id: "assign-user",
          label: t("role.action.assignUsers"),
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
            label: t("role.step.general"),
            icon: <User />,
            schema: CreateRoleSchema.omit({ permissions: true }),
          },
          {
            id: "permissions",
            label: t("role.step.permissions"),
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
  label: "nav.roles",
  translationNs: "translation",
});
