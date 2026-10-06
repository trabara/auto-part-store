// "Fits vehicles" on the product variant page: the variant's fitments.
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProductVariant, DetailWidgetProps } from "@medusajs/framework/types";
import { EntityPanel, Module } from "@repo/dashboard/module";
import { entityLabel } from "@repo/framework/entity";
import automotive from "../modules/automotive";
import { Vehicle } from "../../modules/vehicle/entities";

type Row = Record<string, any>;

/** "2018/03 – 2019", "– 2019", or "" for the vehicle's whole range. */
function productionWindow(row: Row): string {
  const point = (year?: number | null, month?: number | null) =>
    year ? (month ? `${year}/${String(month).padStart(2, "0")}` : String(year)) : "";
  const from = point(row.from_year, row.from_month);
  const to = point(row.to_year, row.to_month);
  return from || to ? `${from} – ${to}`.trim() : "";
}

export default function VariantFitmentsWidget({ data }: DetailWidgetProps<AdminProductVariant>) {
  return (
    <Module module={automotive}>
      <EntityPanel
        module={automotive}
        feature={automotive.features.fitment}
        parent={{ field: "variant_id", value: data.id }}
        title="Fits vehicles"
        description="Vehicles this variant fits, per position."
        columns={[
          { key: "vehicle", label: "Vehicle", render: (r) => entityLabel(Vehicle, r.vehicle) || r.vehicle_id },
          { key: "position", label: "Position", render: (r) => r.position?.name ?? "—" },
          { key: "quantity", label: "Qty" },
          { key: "production", label: "Production", render: (r) => productionWindow(r) || "—" },
        ]}
      />
    </Module>
  );
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
});
