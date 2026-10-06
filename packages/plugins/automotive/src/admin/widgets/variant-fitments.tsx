// "Fits vehicles" on the product variant page: the variant's fitments
// (applications), added and removed where the part is managed.
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProductVariant, DetailWidgetProps } from "@medusajs/framework/types";
import { PencilSquare, Plus, Trash } from "@medusajs/icons";
import { Button, Container, Drawer, Heading, IconButton, Table, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSdk } from "@repo/dashboard/common";
import { Form } from "@repo/dashboard/form";
import {
  Module,
  entityFields,
  entityUrl,
  featurePath,
  relationOverrides,
  useCreateMutation,
  useDeleteMutation,
} from "@repo/dashboard/module";
import { entityLabel } from "@repo/framework/entity";
import automotive from "../modules/automotive";
import { Fitment } from "../../modules/fitment/entities";
import { Vehicle } from "../../modules/vehicle/entities";

type Row = { id: string } & Record<string, any>;

const feature = automotive.features.fitment;
// The variant is fixed by the page.
const createSchema = Fitment.dto.create.omit({ variant_id: true });

/** "2018/03 – 2019", "– 2019", or "" for the vehicle's whole range. */
function productionWindow(row: Row): string {
  const point = (year?: number | null, month?: number | null) =>
    year ? (month ? `${year}/${String(month).padStart(2, "0")}` : String(year)) : "";
  const from = point(row.from_year, row.from_month);
  const to = point(row.to_year, row.to_month);
  return from || to ? `${from} – ${to}`.trim() : "";
}

function VariantFitments({ variant }: { variant: AdminProductVariant }) {
  const sdk = useSdk();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const url = entityUrl(automotive, Fitment);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [Fitment.modelName, "variant", variant.id],
    queryFn: ({ signal }) =>
      sdk.client
        .fetch<{ data: Row[] }>(url, {
          signal,
          query: { variant_id: variant.id, fields: entityFields(automotive, feature), limit: 100 },
        })
        .then((r) => r.data),
  });

  const create = useCreateMutation({
    invalidateKeys: [Fitment.modelName],
    successMessage: "Fitment added",
    errorMessage: "Failed to add fitment",
    createFn: (body) =>
      sdk.client.fetch(url, { method: "POST", body: { ...body, variant_id: variant.id } }),
  });

  const deletion = useDeleteMutation({
    invalidateKeys: [Fitment.modelName],
    successMessage: "Fitment removed",
    errorMessage: "Failed to remove fitment",
    deleteFn: (id) => sdk.client.fetch(entityUrl(automotive, Fitment, id), { method: "DELETE" }),
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Fits vehicles</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Vehicles this variant fits, per position.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setAdding(true)}>
          <Plus /> Add
        </Button>
      </div>

      {rows.length === 0 ? (
        <Text size="small" className="text-ui-fg-subtle px-6 py-4">
          {isLoading ? "Loading…" : "No vehicles yet."}
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Vehicle</Table.HeaderCell>
              <Table.HeaderCell>Position</Table.HeaderCell>
              <Table.HeaderCell>Qty</Table.HeaderCell>
              <Table.HeaderCell>Production</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell>{entityLabel(Vehicle, row.vehicle) || row.vehicle_id}</Table.Cell>
                <Table.Cell>{row.position?.name ?? "—"}</Table.Cell>
                <Table.Cell>{row.quantity}</Table.Cell>
                <Table.Cell>{productionWindow(row) || "—"}</Table.Cell>
                <Table.Cell className="text-right">
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={() => navigate(featurePath(feature, "edit", { id: row.id })!)}
                  >
                    <PencilSquare />
                  </IconButton>
                  <IconButton
                    size="small"
                    variant="transparent"
                    onClick={() => deletion.mutateAsync(row.id)}
                  >
                    <Trash />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Drawer open={adding} onOpenChange={setAdding}>
        <Drawer.Content>
          {adding && (
            <Form
              schema={createSchema as any}
              overrides={relationOverrides(automotive, feature, createSchema)}
              onSubmit={async (values) => {
                await create.mutateAsync(values);
                setAdding(false);
              }}
              className="flex h-full flex-col"
            >
              {({ renderField, renderSubmitButton }, fieldKeys) => (
                <>
                  <Drawer.Header>
                    <Drawer.Title asChild>
                      <Heading level="h2">Add vehicle</Heading>
                    </Drawer.Title>
                  </Drawer.Header>
                  <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
                    {fieldKeys.map((key) => renderField(key))}
                  </Drawer.Body>
                  <Drawer.Footer>
                    <Button variant="secondary" size="small" type="button" onClick={() => setAdding(false)}>
                      Cancel
                    </Button>
                    {renderSubmitButton({ children: "Add" })}
                  </Drawer.Footer>
                </>
              )}
            </Form>
          )}
        </Drawer.Content>
      </Drawer>
    </Container>
  );
}

export default function VariantFitmentsWidget({ data }: DetailWidgetProps<AdminProductVariant>) {
  return (
    <Module module={automotive}>
      <VariantFitments variant={data} />
    </Module>
  );
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
});
