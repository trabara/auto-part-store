import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import { CreateFitmentInput, UpdateFitmentInput } from "@trabara/core/dtos";
import {
  EngineSchema,
  FitmentSchema,
  ModelSchema,
} from "@trabara/core/schemas";
import {
  CreateFitmentInputSchema,
  UpdateFitmentInputSchema,
} from "@trabara/core/validations";
import { CarFront } from "lucide-react";
import { useTranslation } from "react-i18next";
import EngineSelect from "../../components/engine-select";
import ModelSelect from "../../components/model-select";
import ProductDataTable from "../../components/product-data-table";

// Extended list schema with related entities
const FitmentListSchema = FitmentSchema.extend({
  model: ModelSchema,
  engine: EngineSchema,
});

type Fitment = z.infer<typeof FitmentListSchema>;

// Static select options (values are technical codes — not translated)
const BODY_STYLE_OPTIONS = [
  { label: "Sedan", value: "SEDAN" },
  { label: "SUV", value: "SUV" },
  { label: "Hatchback", value: "HATCHBACK" },
  { label: "Coupe", value: "COUPE" },
  { label: "Convertible", value: "CONVERTIBLE" },
  { label: "Wagon", value: "WAGON" },
  { label: "Van", value: "VAN" },
  { label: "Pickup", value: "PICKUP" },
];

const DRIVE_OPTIONS = [
  { label: "FWD", value: "FWD" },
  { label: "RWD", value: "RWD" },
  { label: "AWD", value: "AWD" },
  { label: "4WD", value: "FOUR_WD" },
];

const TRANSMISSION_OPTIONS = [
  { label: "Manual", value: "MANUAL" },
  { label: "Automatic", value: "AUTOMATIC" },
  { label: "CVT", value: "CVT" },
];

const DOORS_OPTIONS = [
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];

export default function FitmentsPage() {
  const { t } = useTranslation();

  const LIST_FIELDS: MedusaFieldOverrides<Fitment> = {
    body_style: {
      label: t("fitment.field.bodyStyle.label"),
      isFiltrable: true,
      options: BODY_STYLE_OPTIONS,
    },
    drive: {
      label: t("fitment.field.drive.label"),
      isFiltrable: true,
      options: DRIVE_OPTIONS,
    },
    transmission: {
      label: t("fitment.field.transmission.label"),
      isFiltrable: true,
      options: TRANSMISSION_OPTIONS,
    },
    doors: {
      label: t("fitment.field.doors.label"),
      isFiltrable: true,
      options: DOORS_OPTIONS,
    },
    year_start: {
      label: t("fitment.field.yearStart.label"),
    },
    year_end: {
      label: t("fitment.field.yearEnd.label"),
    },
    model: {
      label: t("fitment.field.model"),
      cell: (info) => {
        const model = info.row.original.model
        return <span>{model?.name ?? "—"}</span>;
      },
    },
    engine: {
      label: t("fitment.field.engine"),
      cell: (info) => {
        const engine = info.row.original.engine;
        if (!engine) return <span>—</span>;
        return (
          <span>
            {engine.tech || `${engine.type} ${engine.size} ${engine.fuel}`}
          </span>
        );
      },
    },
  };

  const CREATE_FIELDS: MedusaFieldOverrides<CreateFitmentInput> = {
    body_style: {
      label: t("fitment.field.bodyStyle.label"),
      options: BODY_STYLE_OPTIONS,
    },
    drive: {
      label: t("fitment.field.drive.label"),
      options: DRIVE_OPTIONS,
    },
    transmission: {
      label: t("fitment.field.transmission.label"),
      options: TRANSMISSION_OPTIONS,
    },
    doors: {
      label: t("fitment.field.doors.label"),
      type: "number",
    },
    year_start: {
      label: t("fitment.field.yearStart.label"),
      type: "number",
    },
    year_end: {
      label: t("fitment.field.yearEnd.label"),
      type: "number",
    },
    model_id: {
      label: t("fitment.field.model"),
      description: t("fitment.field.model.description"),
      render: ({ value, onChange }) => (
        <ModelSelect
          defaultValue={value as string}
          onChange={onChange as (v: string) => void}
        />
      ),
    },
    engine_id: {
      label: t("fitment.field.engine"),
      description: t("fitment.field.engine.description"),
      render: ({ value, onChange }) => (
        <EngineSelect defaultValue={value} onChange={onChange} />
      ),
    },
  };

  const EDIT_FIELDS: MedusaFieldOverrides<UpdateFitmentInput> = {
    body_style: {
      label: t("fitment.field.bodyStyle.label"),
      options: BODY_STYLE_OPTIONS,
    },
    drive: {
      label: t("fitment.field.drive.label"),
      options: DRIVE_OPTIONS,
    },
    transmission: {
      label: t("fitment.field.transmission.label"),
      options: TRANSMISSION_OPTIONS,
    },
    doors: {
      label: t("fitment.field.doors.label"),
      type: "number",
    },
    year_start: {
      label: t("fitment.field.yearStart.label"),
      type: "number",
    },
    year_end: {
      label: t("fitment.field.yearEnd.label"),
      type: "number",
    },
    model_id: {
      label: t("fitment.field.model"),
      description: t("fitment.field.model.description"),
      render: ({ value, onChange }) => (
        <ModelSelect
          defaultValue={value as string}
          onChange={onChange}
        />
      ),
    },
    engine_id: {
      label: t("fitment.field.engine"),
      description: t("fitment.field.engine.description"),
      render: ({ value, onChange }) => (
        <EngineSelect defaultValue={value} onChange={onChange} />
      ),
    },
  };

  return (
    <MedusaPage
      id="fitment"
      path="/admin/fitments"
      title={t("fitment.page.title")}
      description={t("fitment.page.subtitle")}
      schema={FitmentListSchema}
      fields={LIST_FIELDS}
      rowActions={[{
        id: 'link',
        label: t("product.link"),
        render: (fitment) => <ProductDataTable fitment={fitment} />
      }]}
      create={{
        id: "fitment",
        schema: CreateFitmentInputSchema,
        fields: CREATE_FIELDS,
      }}
      edit={{
        id: "fitment",
        schema: UpdateFitmentInputSchema,
        fields: EDIT_FIELDS,
      }}
    />
  );
}

export const config = defineRouteConfig({
  label: "nav.fitments",
  translationNs: "translation",
  icon: () => <CarFront size={15} />,
});
