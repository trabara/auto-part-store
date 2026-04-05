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
import MakeSelect from "../components/make-select";

type ModelRow = z.infer<typeof ModelSchema>;

const LIST_FIELDS: MedusaFieldOverrides<ModelRow> = {
  name: {
    label: "Name",
    description: "The name of the model",
    isFiltrable: true,
  },
  make: {
    label: "Make",
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
    label: "Name",
    description: "The name of the model",
  },
  make_id: {
    label: "Make",
    description: "The make this model belongs to",
    render: ({ value, onChange }) => (
      <MakeSelect
        defaultValue={value as string}
        onChange={onChange as (v: string) => void}
      />
    ),
  },
};

export default function ModelsPage() {
  return (
    <MedusaPage
      id="model"
      path="/admin/models"
      title="Models"
      description="Manage vehicle models"
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
