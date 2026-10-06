// "Fits vehicles" on the product variant page: the variant's fitments.
import "../setup";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProductVariant, DetailWidgetProps } from "@medusajs/framework/types";
import { AdjustmentsDone } from "@medusajs/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EntityPanel, Module, useLabels } from "@repo/dashboard/module";
import { ConditionsDrawer } from "@repo/module-fitment/admin/ui";
import { Fitment } from "@repo/module-fitment/entities";
import { fitmentAdmin as fitments } from "@repo/module-fitment/admin";
import { Vehicle } from "@repo/module-vehicle/entities";
import { useDomainText } from "../use-domain-text";

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
  const labels = useLabels();
  const text = useDomainText();
  const field = (key: string) => labels.field(Fitment, key);
  return (
    <>
      <EntityPanel
        module={fitments}
        feature={fitments.features.fitment}
        parent={{ field: "variant_id", value: variantId }}
        title={text("widgets.fitments.title")}
        description={text("widgets.fitments.description")}
        columns={[
          {
            key: "vehicle",
            label: field("vehicle"),
            render: (r) => labels.record(Vehicle, r.vehicle) || r.vehicle_id,
          },
          {
            key: "position",
            label: field("position"),
            render: (r) => r.position?.name ?? "—",
          },
          { key: "quantity", label: field("quantity") },
          {
            key: "production",
            label: text("widgets.fitments.production"),
            render: (r) => productionWindow(r) || "—",
          },
          {
            key: "conditions",
            label: field("conditions_summary"),
            render: (r) => r.conditions_summary ?? "—",
          },
        ]}
        rowActions={[
          {
            id: "conditions",
            label: text("widgets.fitments.editConditions"),
            icon: <AdjustmentsDone />,
            onClick: (r) => setEditing(r.id),
          },
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
