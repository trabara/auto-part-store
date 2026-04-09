import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { Badge } from "@medusajs/ui";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { ModelSchema } from "@trabara/core/schemas";
import {
  CreateModelInputSchema,
  UpdateModelInputSchema,
} from "@trabara/core/validations";
import { useTranslation } from "react-i18next";
import MakeSelect from "../../../components/make-select";

type ModelRow = z.infer<typeof ModelSchema>;

export default function ModelsPage() {
  const { t } = useTranslation();

  const LIST_FIELDS: MedusaFieldOverrides<ModelRow> = {
    name: {
      label: t("model.field.name"),
      description: t("model.field.name.description"),
      isFiltrable: true,
    },
    make: {
      label: t("model.field.make"),
      isFiltrable: false,
      cell: (info) => {
        const make = info.getValue() as ModelRow["make"];
        return <Badge>{make?.name ?? "—"}</Badge>;
      },
    },
  };

  const MUTATION_FIELDS: MedusaFieldOverrides<
    z.infer<typeof CreateModelInputSchema>
  > = {
    name: {
      label: t("model.field.name"),
      description: t("model.field.name.description"),
    },
    make_id: {
      label: t("model.field.make"),
      description: t("model.field.make.description"),
      render: ({ value, onChange }) => (
        <MakeSelect
          defaultValue={value as string}
          onChange={onChange as (v: string) => void}
        />
      ),
    },
  };

  return (
    <MedusaPage
      id="model"
      path="/admin/models"
      title={t("model.page.title")}
      description={t("model.page.subtitle")}
      schema={ModelSchema}
      fields={LIST_FIELDS}
      create={{
        id: "model",
        schema: CreateModelInputSchema,
        fields: MUTATION_FIELDS,
      }}
      edit={{
        id: "model",
        schema: UpdateModelInputSchema,
        fields: MUTATION_FIELDS,
      }}
    />
  );
}

export const handle = {
  breadcrumb: () => "Models",
};

export const config = defineRouteConfig({
  label: "nav.models",
  translationNs: "translation",
});
