import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { EngineSchema } from "@trabara/core/schemas";
import {
  CreateEngineInputSchema,
  UpdateEngineInputSchema,
} from "@trabara/core/validations";

const FUEL_OPTIONS = [
  { label: "Gasoline", value: "GASOLINE" },
  { label: "Diesel", value: "DIESEL" },
  { label: "Electric", value: "ELECTRIC" },
  { label: "Hybrid", value: "HYBRID" },
];

const ENGINE_TYPE_OPTIONS = [
  { label: "I4", value: "I4" },
  { label: "V4", value: "V4" },
  { label: "V6", value: "V6" },
  { label: "V8", value: "V8" },
  { label: "Electric", value: "ELECTRIC" },
  { label: "Hybrid", value: "HYBRID" },
];

const ENGINE_SIZE_OPTIONS = [
  { label: "1.0L", value: "1.0" },
  { label: "1.2L", value: "1.2" },
  { label: "1.4L", value: "1.4" },
  { label: "1.5L", value: "1.5" },
  { label: "1.6L", value: "1.6" },
  { label: "1.8L", value: "1.8" },
  { label: "2.0L", value: "2.0" },
  { label: "2.2L", value: "2.2" },
  { label: "2.4L", value: "2.4" },
  { label: "2.5L", value: "2.5" },
  { label: "2.7L", value: "2.7" },
  { label: "3.0L", value: "3.0" },
  { label: "3.5L", value: "3.5" },
  { label: "3.6L", value: "3.6" },
  { label: "4.0L", value: "4.0" },
  { label: "Electric", value: "Electric" },
];

const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof EngineSchema>> = {
  fuel: {
    label: "Fuel",
    description: "Fuel type of the engine",
    isFiltrable: true,
    options: FUEL_OPTIONS,
  },
  type: {
    label: "Type",
    description: "Engine configuration type",
    isFiltrable: true,
    options: ENGINE_TYPE_OPTIONS,
  },
  size: {
    label: "Size",
    description: "Engine displacement (e.g. 2.0)",
    isFiltrable: true,
    options: ENGINE_SIZE_OPTIONS,
  },
  tech: {
    label: "Tech",
    description: "Technology descriptor (e.g. TFSI, TDI)",
  },
};

export default function EnginesPage() {
  return (
    <MedusaPage
      id="engine"
      path="/admin/engines"
      title="Engines"
      description="Manage vehicle engines"
      schema={EngineSchema}
      fields={BASE_FIELDS}
      create={{
        id: "engine",
        schema: CreateEngineInputSchema,
        fields: BASE_FIELDS,
      }}
      edit={{
        id: "engine",
        schema: UpdateEngineInputSchema,
        fields: BASE_FIELDS,
      }}
    />
  );
}

export const handle = {
  breadcrumb: () => "Engines",
};

export const config = defineRouteConfig({
  label: "nav.engines",
  translationNs: "translation",
});
