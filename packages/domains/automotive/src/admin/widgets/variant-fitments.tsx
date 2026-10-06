// "Fits vehicles" on the product variant page: the variant's fitments.
import "../setup";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProductVariant, DetailWidgetProps } from "@medusajs/framework/types";
import { AdjustmentsDone } from "@medusajs/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EntityPanel, Module } from "@repo/dashboard/module";
import { ConditionsDrawer } from "@repo/module-fitment/admin/ui";
import { Fitment } from "@repo/module-fitment/entities";
import { entityLabel } from "@repo/framework/entity";
import { fitmentAdmin as fitments } from "@repo/module-fitment/admin";
import { Vehicle } from "@repo/module-vehicle/entities";

type Row = Record<string, any>;

/** "2018/03 – 2019", "– 2019", or "" for the vehicle's whole range. */
function productionWindow(row: Row): string {
  const point = (year?: number | null, month?: number | null) =>
    year ? (month ? `${year}/${String(month).padStart(2, "0")}` : String(year)) : "";
  const from = point(row.from_year, row.from_month);
  const to = point(row.to_year, row.to_month);
  return from || to ? `${from} – ${to}`.trim() : "";
}

function VariantFitments({ variantId }: { variantId: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const queryClient = useQueryClient();
  return (
    <>
      <EntityPanel
        module={fitments}
        feature={fitments.features.fitment}
        parent={{ field: "variant_id", value: variantId }}
        title="Fits vehicles"
        description="Vehicles this variant fits, per position."
        columns={[
          { key: "vehicle", label: "Vehicle", render: (r) => entityLabel(Vehicle, r.vehicle) || r.vehicle_id },
          { key: "position", label: "Position", render: (r) => r.position?.name ?? "—" },
          { key: "quantity", label: "Qty" },
          { key: "production", label: "Production", render: (r) => productionWindow(r) || "—" },
          { key: "conditions", label: "Conditions", render: (r) => r.conditions_summary ?? "—" },
        ]}
        rowActions={[
          { id: "conditions", label: "Edit conditions", icon: <AdjustmentsDone />, onClick: (r) => setEditing(r.id) },
        ]}
      />
      {editing && (
        <ConditionsDrawer
          fitmentId={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: [Fitment.modelName] })}
        />
      )}
    </>
  );
}

export default function VariantFitmentsWidget({ data }: DetailWidgetProps<AdminProductVariant>) {
  return (
    <Module module={fitments}>
      <VariantFitments variantId={data.id} />
    </Module>
  );
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
});
