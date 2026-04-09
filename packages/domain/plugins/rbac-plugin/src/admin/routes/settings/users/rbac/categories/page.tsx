import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@trabara/core/validations";
import { CategorySchema } from "@trabara/core/schemas";
import { useTranslation } from "react-i18next";

export default function CategoriesPage() {
  const { t } = useTranslation();

  const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof CategorySchema>> = {
    name: {
      label: t("category.field.name.label"),
      description: t("category.field.name.description"),
      isFiltrable: true,
    },
    description: {
      label: t("category.field.description.label"),
      description: t("category.field.description.description"),
      isFiltrable: true,
    },
  };

  return (
    <MedusaPage
      id="category"
      path="/admin/rbac/v2/categories"
      title={t("category.page.title")}
      description={t("category.page.subtitle")}
      schema={CategorySchema}
      fields={{
        ...BASE_FIELDS,
      }}
      create={{
        id: "category",
        title: t("category.create.title"),
        description: t("category.create.subtitle"),
        schema: CreateCategorySchema,
        fields: {
          ...BASE_FIELDS,
        },
      }}
      edit={{
        id: "category",
        schema: UpdateCategorySchema,
        title: t("category.edit.title"),
        description: t("category.edit.subtitle"),
        fields: {
          ...BASE_FIELDS,
        },
      }}
    />
  );
}

export const handle = {
  breadcrumb: () => "Categories",
};

export const config = defineRouteConfig({
  label: "nav.categories",
  translationNs: "translation",
});
