import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { MakeSchema } from "@trabara/core/schemas";
import {
  CreateMakeInputSchema,
  UpdateMakeInputSchema,
} from "@trabara/core/validations";

const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof MakeSchema>> = {
  name: {
    label: "Name",
    description: "The name of the make",
    isFiltrable: true,
  },
};

export default function MakesPage() {
  return (
    <MedusaPage
      id="make"
      path="/admin/makes"
      title="Makes"
      description="Manage vehicle makes"
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
