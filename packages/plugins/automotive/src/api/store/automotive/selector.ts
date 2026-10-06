// Vehicle selector (Year / Make / Model / Generation / Vehicle) for the storefront.
import type { MedusaStoreRequest } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { entityLabel } from "@repo/framework/entity";
import { Vehicle, VehicleGeneration } from "../../../modules/vehicle/entities";
import type { StoreSelectorParams } from "./validators";

type Range = { year_start: number; year_end: number | null };
const covers = (r: Range, year?: number) =>
  year == null || (r.year_start <= year && (r.year_end == null || r.year_end >= year));

export async function graph(req: MedusaStoreRequest<unknown>, entity: string, fields: string[], filters = {}) {
  const query = req.scope.resolve<any>(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity, fields, filters });
  return data as Record<string, any>[];
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

export const params = (req: MedusaStoreRequest<unknown>) => req.validatedQuery as StoreSelectorParams;

export function required(value: string | undefined, name: string): string {
  if (!value) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${name} is required`);
  return value;
}

export async function makes(req: MedusaStoreRequest<unknown>) {
  return (await graph(req, "vehicle_make", ["id", "name", "slug", "logo"])).sort(byName);
}

export async function models(req: MedusaStoreRequest<unknown>, makeId: string) {
  return (await graph(req, "vehicle_model", ["id", "name", "slug", "image", "category"], { make_id: makeId })).sort(byName);
}

export async function generations(req: MedusaStoreRequest<unknown>, modelId: string, year?: number) {
  const rows = await graph(req, "vehicle_generation", ["id", ...VehicleGeneration.label.fields, "image"], { model_id: modelId });
  return rows
    .filter((g) => covers(g as Range, year))
    .sort((a, b) => a.year_start - b.year_start)
    .map((g) => ({ ...g, label: entityLabel(VehicleGeneration, g) }));
}

export async function vehicles(req: MedusaStoreRequest<unknown>, generationId: string, year?: number) {
  const fields = ["id", "body_style", "doors", "drive", "transmission", ...Vehicle.label.fields];
  const rows = await graph(req, "vehicle", fields, { generation_id: generationId });
  return rows
    .filter((v) => covers(v as Range, year))
    .map((v) => ({ ...v, label: entityLabel(Vehicle, v) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
