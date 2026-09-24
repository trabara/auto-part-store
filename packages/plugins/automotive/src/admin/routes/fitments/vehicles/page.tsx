import { defineRouteConfig } from "@medusajs/admin-sdk";
import { z } from "@medusajs/framework/zod";
import { VehicleSchema } from "../../../../modules/fitment/schemas/vehicle";

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

export default function VehiclePage() {
  // const { t } = useTranslation();

  // const LIST_FIELDS: MedusaFieldOverrides<Fitment> = {
  //   model: {
  //     label: t("fitment.field.model"),
  //     cell: (info) => {
  //       const model = info.row.original.model;
  //       return <span>{`${model.make.name} ${model.name}`}</span>;
  //     },
  //   },
  //   engine: {
  //     label: t("fitment.field.engine"),
  //     cell: (info) => {
  //       const engine = info.row.original.engine;
  //       if (!engine) return <span>—</span>;
  //       return <span>{`${engine.type} ${engine.size} ${engine.fuel}`}</span>;
  //     },
  //   },
  //   body_style: {
  //     label: t("fitment.field.bodyStyle.label"),
  //     isFiltrable: true,
  //     options: BODY_STYLE_OPTIONS,
  //   },
  //   drive: {
  //     label: t("fitment.field.drive.label"),
  //     isFiltrable: true,
  //     options: DRIVE_OPTIONS,
  //   },
  //   transmission: {
  //     label: t("fitment.field.transmission.label"),
  //     isFiltrable: true,
  //     options: TRANSMISSION_OPTIONS,
  //   },
  //   doors: {
  //     label: t("fitment.field.doors.label"),
  //     isFiltrable: true,
  //     options: DOORS_OPTIONS,
  //   },
  //   year_start: {
  //     label: t("fitment.field.yearStart.label"),
  //   },
  //   year_end: {
  //     label: t("fitment.field.yearEnd.label"),
  //   },
  // };

  // const CREATE_FIELDS: MedusaFieldOverrides<CreateVehicleInput> = {
  //   body_style: {
  //     label: t("fitment.field.bodyStyle.label"),
  //     options: BODY_STYLE_OPTIONS,
  //   },
  //   drive: {
  //     label: t("fitment.field.drive.label"),
  //     options: DRIVE_OPTIONS,
  //   },
  //   transmission: {
  //     label: t("fitment.field.transmission.label"),
  //     options: TRANSMISSION_OPTIONS,
  //   },
  //   doors: {
  //     label: t("fitment.field.doors.label"),
  //     type: "number",
  //   },
  //   year_start: {
  //     label: t("fitment.field.yearStart.label"),
  //     type: "number",
  //   },
  //   year_end: {
  //     label: t("fitment.field.yearEnd.label"),
  //     type: "number",
  //   },
  //   model_id: {
  //     label: t("fitment.field.model"),
  //     description: t("fitment.field.model.description"),
  //     render: ({ value, onChange }) => (
  //       <ModelSelect
  //         defaultValue={value as string}
  //         onChange={onChange as (v: string) => void}
  //       />
  //     ),
  //   },
  //   engine_id: {
  //     label: t("fitment.field.engine"),
  //     description: t("fitment.field.engine.description"),
  //     render: ({ value, onChange }) => (
  //       <EngineSelect defaultValue={value} onChange={onChange} />
  //     ),
  //   },
  // };

  // const EDIT_FIELDS: MedusaFieldOverrides<UpdateVehicleInput> = {
  //   body_style: {
  //     label: t("fitment.field.bodyStyle.label"),
  //     options: BODY_STYLE_OPTIONS,
  //   },
  //   drive: {
  //     label: t("fitment.field.drive.label"),
  //     options: DRIVE_OPTIONS,
  //   },
  //   transmission: {
  //     label: t("fitment.field.transmission.label"),
  //     options: TRANSMISSION_OPTIONS,
  //   },
  //   doors: {
  //     label: t("fitment.field.doors.label"),
  //     type: "number",
  //   },
  //   year_start: {
  //     label: t("fitment.field.yearStart.label"),
  //     type: "number",
  //   },
  //   year_end: {
  //     label: t("fitment.field.yearEnd.label"),
  //     type: "number",
  //   },
  //   model_id: {
  //     label: t("fitment.field.model"),
  //     description: t("fitment.field.model.description"),
  //     render: ({ value, onChange }) => (
  //       <ModelSelect defaultValue={value as string} onChange={onChange} />
  //     ),
  //   },
  //   engine_id: {
  //     label: t("fitment.field.engine"),
  //     description: t("fitment.field.engine.description"),
  //     render: ({ value, onChange }) => (
  //       <EngineSelect defaultValue={value} onChange={onChange} />
  //     ),
  //   },
  // };

  return <></>;
}

export const config = defineRouteConfig({
  label: "nav.fitments",
  translationNs: "translation",
});
