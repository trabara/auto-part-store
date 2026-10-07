// "Garage" on the customer page: the vehicles the customer saved.
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminCustomer, DetailWidgetProps } from "@medusajs/framework/types";
import { EntityPanel, Module, useLabels } from "@repo/dashboard/module";
import { vehicleAdmin as vehicles } from "@repo/module-vehicle/admin";
import { CustomerVehicle, Vehicle } from "@repo/module-vehicle/contract";
import { useDomainText } from "../hooks/use-domain-text";

function CustomerGarage({ customerId }: { customerId: string }) {
  const labels = useLabels();
  const text = useDomainText();
  const field = (key: string) => labels.field(CustomerVehicle, key);
  return (
    <EntityPanel
      module={vehicles}
      feature={vehicles.features.customer_vehicle}
      parent={{ field: "customer_id", value: customerId }}
      title={text("widgets.garage.title")}
      description={text("widgets.garage.description")}
      columns={[
        {
          key: "vehicle",
          label: field("vehicle"),
          render: (r) => labels.record(Vehicle, r.vehicle) || r.vehicle_id,
        },
        {
          key: "nickname",
          label: field("nickname"),
          render: (r) => r.nickname ?? "—",
        },
        {
          key: "registration",
          label: field("registration"),
          render: (r) => r.registration ?? "—",
        },
        { key: "vin", label: field("vin"), render: (r) => r.vin ?? "—" },
        {
          key: "is_default",
          label: field("is_default"),
          render: (r) => (r.is_default ? text("widgets.garage.yes") : ""),
        },
      ]}
    />
  );
}

export default function CustomerGarageWidget({ data }: DetailWidgetProps<AdminCustomer>) {
  return (
    <Module module={vehicles}>
      <CustomerGarage customerId={data.id} />
    </Module>
  );
}

export const config = defineWidgetConfig({
  zone: "customer.details.after",
});
