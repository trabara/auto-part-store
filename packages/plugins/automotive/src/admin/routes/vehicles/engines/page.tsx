import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { EngineSchema } from "@trabara/core/schemas";
import {
  CreateEngineInputSchema,
  UpdateEngineInputSchema,
} from "@trabara/core/validations";
import { useTranslation } from "react-i18next";

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

export default function EnginesPage() {
  const { t } = useTranslation();

  const BASE_FIELDS: MedusaFieldOverrides<z.infer<typeof EngineSchema>> = {
    fuel: {
      label: t("engine.field.fuel.label"),
      description: t("engine.field.fuel.description"),
      isFiltrable: true,
      options: FUEL_OPTIONS,
    },
    type: {
      label: t("engine.field.type.label"),
      description: t("engine.field.type.description"),
      isFiltrable: true,
      options: ENGINE_TYPE_OPTIONS,
    },
    size: {
      label: t("engine.field.size"),
      description: t("engine.field.size.description"),
      isFiltrable: true,
      options: ENGINE_SIZE_OPTIONS,
    },
    tech: {
      label: t("engine.field.tech.label"),
      description: t("engine.field.tech.description"),
    },
  };

  return (
    <MedusaPage
      id="engine"
      path="/admin/engines"
      title={t("engine.page.title")}
      description={t("engine.page.subtitle")}
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
