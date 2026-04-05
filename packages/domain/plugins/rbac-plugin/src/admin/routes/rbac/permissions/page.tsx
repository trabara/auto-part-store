import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import {
  CreatePermissionSchema,
  UpdatePermissionSchema,
} from "@trabara/core/validations";
import { PermissionSchema } from "@trabara/core/schemas";
import { useTranslation } from "react-i18next";
import CategorySelect from "../components/category-select";

export default function PermissionsPage() {
  const { t } = useTranslation();

  const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof PermissionSchema>> = {
    target: {
      label: t("permission.field.target.label"),
      description: t("permission.field.target.description"),
    },
    kind: {
      label: t("permission.field.kind.label"),
      description: t("permission.field.kind.description"),
      isFiltrable: true,
    },
    type: {
      label: t("permission.field.type.label"),
      description: t("permission.field.type.description"),
      isFiltrable: true,
    },
    category: {
      label: t("permission.field.category.label"),
      description: t("permission.field.category.description"),
      isFiltrable: true,
    },
  };

  const CATEGORY_FIELDS: MedusaFieldOverrides<
    z.infer<typeof UpdatePermissionSchema>
  > = {
    category_id: {
      label: t("permission.field.category_id.label"),
      description: t("permission.field.category_id.description"),
      render: ({ value, onChange }) => (
        <CategorySelect defaultValue={value} onChange={(id) => onChange(id)} />
      ),
    },
  };

  return (
    <MedusaPage
      id="permission"
      path="/admin/rbac/v2/permissions"
      title={t("permission.page.title")}
      description={t("permission.page.subtitle")}
      schema={PermissionSchema}
      fields={{
        ...BASE_FIELDS,
        category: {
          label: t("permission.field.category.label"),
          description: t("permission.field.category.description"),
          cell: (info) => <span>{info.getValue()?.name}</span>,
          isFiltrable: true,
        },
      }}
      create={{
        id: "permission",
        title: t("permission.create.title"),
        description: t("permission.create.subtitle"),
        schema: CreatePermissionSchema,
        fields: {
          ...BASE_FIELDS,
          ...CATEGORY_FIELDS,
        },
      }}
      edit={{
        id: "permission",
        schema: UpdatePermissionSchema,
        title: t("permission.edit.title"),
        description: t("permission.edit.subtitle"),
        fields: {
          ...BASE_FIELDS,
          ...CATEGORY_FIELDS,
        },
      }}
    />
  );
}

export const handle = {
  breadcrumb: () => "Permissions",
};

export const config = defineRouteConfig({
  label: "nav.permissions",
  translationNs: "translation",
});
