// "Garage" on the customer page: the vehicles the customer saved.
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminCustomer, DetailWidgetProps } from "@medusajs/framework/types";
import { EntityPanel, Module } from "@repo/dashboard/module";
import { entityLabel } from "@repo/framework/entity";
import automotive from "../modules/automotive";
import { Vehicle } from "../../modules/vehicle/entities";

export default function CustomerGarageWidget({ data }: DetailWidgetProps<AdminCustomer>) {
  return (
    <Module module={automotive}>
      <EntityPanel
        module={automotive}
        feature={automotive.features.customer_vehicle}
        parent={{ field: "customer_id", value: data.id }}
        title="Garage"
        description="Vehicles this customer saved."
        columns={[
          { key: "vehicle", label: "Vehicle", render: (r) => entityLabel(Vehicle, r.vehicle) || r.vehicle_id },
          { key: "nickname", label: "Nickname", render: (r) => r.nickname ?? "—" },
          { key: "registration", label: "Plate", render: (r) => r.registration ?? "—" },
          { key: "vin", label: "VIN", render: (r) => r.vin ?? "—" },
          { key: "is_default", label: "Default", render: (r) => (r.is_default ? "Yes" : "") },
        ]}
      />
    </Module>
  );
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
});
