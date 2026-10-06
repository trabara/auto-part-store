import { PencilSquare, Plus, Trash } from "@medusajs/icons";
import { Button, Container, Drawer, Heading, IconButton, Table, Text } from "@medusajs/ui";
import { z } from "@medusajs/framework/zod";
import { useQuery } from "@tanstack/react-query";
import type { FeatureDef, ModuleDef } from "@repo/framework/core";
import { entityLabel, isToOne, relationField } from "@repo/framework/entity";
import { startCase } from "lodash";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSdk } from "../../common/context";
import { Form } from "../../form/components/form";
import { useCreateMutation } from "../hooks/use-create-mutation";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { useUpdateMutation } from "../hooks/use-update-mutation";
import { formOverrides, recordDefaults, stepOrdered } from "../utils/form-values";
import { entityFields } from "../utils/query";
import { entityUrl, featureRelations } from "../utils/routes";

type Row = { id: string } & Record<string, any>;

export type PanelColumn = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
};

export type EntityPanelProps = {
  module: ModuleDef;
  feature: FeatureDef;
  /** The parent the records belong to: filters the list, fixed on create. */
  parent: { field: string; value: string };
  title: string;
  description?: string;
  /** Columns; defaults to the form fields (relations by their label). */
  columns?: PanelColumn[];
  /** Rendered next to the title (e.g. the parent's brand). */
  aside?: ReactNode;
  /** Extra row buttons, before edit / delete. */
  rowActions?: { id: string; label: string; icon: ReactNode; onClick: (row: Row) => void }[];
};

const omit = (schema: z.ZodObject<any>, field: string) =>
  field in schema.shape ? schema.omit({ [field]: true } as any) : schema;

/** `schema` with its keys in the feature's wizard order. */
const ordered = (feature: FeatureDef, schema: z.ZodObject<any>) =>
  z.object(Object.fromEntries(stepOrdered(feature, Object.keys(schema.shape)).map((k) => [k, schema.shape[k]])));

/**
 * The records of a feature that belong to a parent (e.g. a variant's part
 * numbers), listed with add / edit / delete in drawers. For admin widgets;
 * render inside `<Module module={…}>`.
 */
export function EntityPanel({
  module,
  feature,
  parent,
  title,
  description,
  columns,
  aside,
  rowActions = [],
}: EntityPanelProps) {
  const sdk = useSdk();
  const { t } = useTranslation();
  const entity = feature.entity;
  const name = startCase(entity.name);
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const createSchema = ordered(feature, omit(entity.dto.create as z.ZodObject<any>, parent.field));
  const updateSchema = ordered(feature, omit(entity.dto.update as z.ZodObject<any>, parent.field));

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [entity.modelName, parent.field, parent.value],
    queryFn: ({ signal }) =>
      sdk.client
        .fetch<{ data: Row[] }>(entityUrl(module, entity), {
          signal,
          query: { [parent.field]: parent.value, fields: entityFields(module, feature), limit: 100 },
        })
        .then((r) => r.data),
  });

  const create = useCreateMutation({
    invalidateKeys: [entity.modelName],
    successMessage: `${name} added`,
    errorMessage: `Failed to add ${name.toLowerCase()}`,
    createFn: (body) =>
      sdk.client.fetch(entityUrl(module, entity), {
        method: "POST",
        body: { ...body, [parent.field]: parent.value },
      }),
  });
  const update = useUpdateMutation({
    invalidateKeys: [entity.modelName],
    successMessage: `${name} updated`,
    errorMessage: `Failed to update ${name.toLowerCase()}`,
    updateFn: (body) =>
      sdk.client.fetch(entityUrl(module, entity, (editing as Row).id), { method: "PUT", body }),
  });
  const deletion = useDeleteMutation({
    invalidateKeys: [entity.modelName],
    successMessage: `${name} removed`,
    errorMessage: `Failed to remove ${name.toLowerCase()}`,
    deleteFn: (id) => sdk.client.fetch(entityUrl(module, entity, id), { method: "DELETE" }),
  });

  // Default columns: the create form's fields; to-one relations by label.
  const relationByField = new Map(
    featureRelations(module, feature)
      .filter((r) => isToOne(r.relation) && r.targetEntity)
      .map((r) => [relationField(r.key, r.relation) ?? r.key, r]),
  );
  const shown: PanelColumn[] =
    columns ??
    Object.keys(createSchema.shape).map((key) => {
      const rel = relationByField.get(key);
      return rel
        ? { key, label: rel.label, render: (row) => entityLabel(rel.targetEntity!, row[rel.key]) || "—" }
        : { key, label: startCase(key) };
    });

  const isNew = editing === "new";
  const schema = isNew ? createSchema : updateSchema;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-x-4 px-6 py-4">
        <div>
          <Heading level="h2">{title}</Heading>
          {description && (
            <Text size="small" className="text-ui-fg-subtle">
              {description}
            </Text>
          )}
        </div>
        <div className="flex items-center gap-x-3">
          {aside}
          <Button size="small" variant="secondary" onClick={() => setEditing("new")}>
            <Plus /> {t("common.add", "Add")}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Text size="small" className="text-ui-fg-subtle px-6 py-4">
          {isLoading ? t("common.loading", "Loading…") : `No ${name.toLowerCase()} yet.`}
        </Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              {shown.map((c) => (
                <Table.HeaderCell key={c.key}>{c.label}</Table.HeaderCell>
              ))}
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.id}>
                {shown.map((c) => (
                  <Table.Cell key={c.key}>{c.render ? c.render(row) : (row[c.key] ?? "—")}</Table.Cell>
                ))}
                <Table.Cell className="whitespace-nowrap text-right">
                  {rowActions.map((action) => (
                    <IconButton
                      key={action.id}
                      size="small"
                      variant="transparent"
                      title={action.label}
                      aria-label={action.label}
                      onClick={() => action.onClick(row)}
                    >
                      {action.icon}
                    </IconButton>
                  ))}
                  <IconButton size="small" variant="transparent" onClick={() => setEditing(row)}>
                    <PencilSquare />
                  </IconButton>
                  <IconButton size="small" variant="transparent" onClick={() => deletion.mutateAsync(row.id)}>
                    <Trash />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <Drawer.Content>
          {editing !== null && (
            <Form
              key={isNew ? "new" : (editing as Row).id}
              schema={schema as any}
              defaultValues={
                isNew ? undefined : (recordDefaults(module, feature, schema, editing as Row) as any)
              }
              overrides={formOverrides(module, feature, schema)}
              onSubmit={async (values) => {
                await (isNew ? create : update).mutateAsync(values);
                setEditing(null);
              }}
              className="flex h-full flex-col"
            >
              {({ renderField, renderSubmitButton }, fieldKeys) => (
                <>
                  <Drawer.Header>
                    <Drawer.Title asChild>
                      <Heading level="h2">
                        {isNew ? t("common.add", "Add") : t("common.edit", "Edit")} {name.toLowerCase()}
                      </Heading>
                    </Drawer.Title>
                  </Drawer.Header>
                  <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
                    {fieldKeys.map((key) => renderField(key))}
                  </Drawer.Body>
                  <Drawer.Footer>
                    <Button variant="secondary" size="small" type="button" onClick={() => setEditing(null)}>
                      {t("common.cancel", "Cancel")}
                    </Button>
                    {renderSubmitButton({ children: isNew ? t("common.add", "Add") : t("common.save", "Save") })}
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
