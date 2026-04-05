import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { CarFront } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MedusaPage } from "@repo/admin/components/medusa-page";
import { MedusaFieldOverrides } from "@repo/admin/types/config";
import {
  EngineSchema,
  FitmentSchema,
  ModelSchema,
} from "@trabara/core/schemas";
import {
  CreateFitmentInputSchema,
  UpdateFitmentInputSchema,
} from "@trabara/core/validations";
import EngineSelect from "./components/engine-select";
import ModelSelect from "./components/model-select";

// Extended list schema with related entities
const FitmentListSchema = FitmentSchema.extend({
  model: ModelSchema,
  engine: EngineSchema,
});

type FitmentRow = z.infer<typeof FitmentListSchema>;

// Static select options derived from schema enum values
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

const LIST_FIELDS: MedusaFieldOverrides<FitmentRow> = {
  body_style: {
    label: "Body Style",
    isFiltrable: true,
    options: BODY_STYLE_OPTIONS,
  },
  drive: {
    label: "Drive",
    isFiltrable: true,
    options: DRIVE_OPTIONS,
  },
  transmission: {
    label: "Transmission",
    isFiltrable: true,
    options: TRANSMISSION_OPTIONS,
  },
  doors: {
    label: "Doors",
  },
  year_start: {
    label: "Year Start",
  },
  year_end: {
    label: "Year End",
  },
  model: {
    label: "Model",
    cell: (info) => {
      const model = info.getValue() as FitmentRow["model"];
      return <span>{model?.name ?? "—"}</span>;
    },
  },
  engine: {
    label: "Engine",
    cell: (info) => {
      const engine = info.getValue() as FitmentRow["engine"];
      if (!engine) return <span>—</span>;
      return (
        <span>
          {engine.tech || `${engine.type} ${engine.size} ${engine.fuel}`}
        </span>
      );
    },
  },
};

const CREATE_FIELDS: MedusaFieldOverrides<
  z.infer<typeof CreateFitmentInputSchema>
> = {
  body_style: {
    label: "Body Style",
    options: BODY_STYLE_OPTIONS,
  },
  drive: {
    label: "Drive",
    options: DRIVE_OPTIONS,
  },
  transmission: {
    label: "Transmission",
    options: TRANSMISSION_OPTIONS,
  },
  doors: {
    label: "Doors",
    type: "number",
  },
  year_start: {
    label: "Year Start",
    type: "number",
  },
  year_end: {
    label: "Year End",
    type: "number",
  },
  model_id: {
    label: "Model",
    description: "The vehicle model for this fitment",
    render: ({ value, onChange }) => (
      <ModelSelect
        defaultValue={value as string}
        onChange={onChange as (v: string) => void}
      />
    ),
  },
  engine_id: {
    label: "Engine",
    description: "The engine configuration for this fitment",
    render: ({ value, onChange }) => (
      <EngineSelect
        defaultValue={value as string}
        onChange={onChange as (v: string) => void}
      />
    ),
  },
};

const EDIT_FIELDS: MedusaFieldOverrides<
  z.infer<typeof UpdateFitmentInputSchema>
> = {
  body_style: {
    label: "Body Style",
    options: BODY_STYLE_OPTIONS,
  },
  drive: {
    label: "Drive",
    options: DRIVE_OPTIONS,
  },
  transmission: {
    label: "Transmission",
    options: TRANSMISSION_OPTIONS,
  },
  doors: {
    label: "Doors",
    type: "number",
  },
  year_start: {
    label: "Year Start",
    type: "number",
  },
  year_end: {
    label: "Year End",
    type: "number",
  },
  model_id: {
    label: "Model",
    description: "The vehicle model for this fitment",
    render: ({ value, onChange }) => (
      <ModelSelect
        defaultValue={value as string}
        onChange={onChange as (v: string) => void}
      />
    ),
  },
  engine_id: {
    label: "Engine",
    description: "The engine configuration for this fitment",
    render: ({ value, onChange }) => (
      <EngineSelect
        defaultValue={value as string}
        onChange={onChange as (v: string) => void}
      />
    ),
  },
};

export default function FitmentsPage() {
  const navigate = useNavigate();

  return (
    <MedusaPage
      id="fitment"
      path="/admin/fitments"
      title="Fitments"
      description="Manage vehicle fitments"
      schema={FitmentListSchema}
      fields={LIST_FIELDS}
      onRowClick={(row) => navigate(`/fitments/${row.id}/products`)}
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
