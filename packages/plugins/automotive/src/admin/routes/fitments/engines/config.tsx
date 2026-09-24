import { z } from "@medusajs/framework/zod";
import type { CrudConfig } from "@repo/medusa-ui";

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

// ─── List fields ─────────────────────────────────────────────

export const LIST_SCHEMA = z.object({});

export const createListFields = (t: (key: string) => string) => {
  return {
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
};

// ─── Create config ───────────────────────────────────────────

export const CREATE_SCHEMA = z.object({});

export const CREATE_FIELDS = {};

export const CREATE_STEPS = [];

// ─── Edit config ─────────────────────────────────────────────

export const EDIT_SCHEMA = z.object({});

export const EDIT_FIELDS = {};

// ─── Page config (for PageProvider) ──────────────────────────

export const createPageConfig = (t: (key: string) => string): CrudConfig => ({
  name: "Repair Request",
  path: "/repair-requests",
  listMount: "repair_requests",
  listSchema: LIST_SCHEMA,
  listFields: createListFields(t),
  createSchema: CREATE_SCHEMA,
  createFields: CREATE_FIELDS,
  createSteps: CREATE_STEPS,
  editSchema: EDIT_SCHEMA,
  editFields: EDIT_FIELDS,
});
