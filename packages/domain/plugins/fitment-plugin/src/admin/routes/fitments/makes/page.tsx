import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { MakeSchema } from "@trabara/core/schemas";
import {
  CreateMakeInputSchema,
  UpdateMakeInputSchema,
} from "@trabara/core/validations";
import { useTranslation } from "react-i18next";

export default function MakesPage() {
  const { t } = useTranslation();

  const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof MakeSchema>> = {
    name: {
      label: t("make.field.name"),
      description: t("make.field.name.description"),
      isFiltrable: true,
    },
  };

  return (
    <MedusaPage
      id="make"
      path="/admin/makes"
      title={t("make.page.title")}
      description={t("make.page.subtitle")}
      schema={MakeSchema}
      fields={BASE_FIELDS}
      create={{
        id: "make",
        schema: CreateMakeInputSchema,
        fields: BASE_FIELDS,
      }}
      edit={{
        id: "make",
        schema: UpdateMakeInputSchema,
        fields: BASE_FIELDS,
      }}
    />
  );
}

export const handle = {
  breadcrumb: () => "Makes",
};

export const config = defineRouteConfig({
  label: "nav.makes",
  translationNs: "translation",
});
