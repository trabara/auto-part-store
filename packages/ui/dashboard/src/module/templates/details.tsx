import { z } from "@medusajs/framework/zod";
import { ArrowUpRightOnBox, PencilSquare, Trash } from "@medusajs/icons";
import { Container, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import type { RouteRenderContext } from "@repo/framework/admin";
import type { FeatureDef } from "@repo/framework/core";
import { foreignKeyName, ownsForeignKey, type RelationDef } from "@repo/framework/entity";
import { startCase } from "lodash";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useSdk } from "../../common/context";
import { DataTable } from "../components/data-table";
import { DetailsSection, type Attribute } from "../components/details-section";
import { useDeleteMutation } from "../hooks/use-delete-mutation";
import { entityFields, toQueryFilters } from "../utils/query";
import {
  entityUrl,
  featurePath,
  featureRelations,
  useFeature,
  type ResolvedRelation,
} from "../utils/routes";

type Row = { id: string } & Record<string, any>;
type ListResponse = { data: Row[]; metadata: { count: number } };

const HIDDEN_FIELDS = new Set(["deleted_at"]);

function scalarAttributes(
  entity: FeatureDef["entity"],
  record: Record<string, unknown> | null | undefined,
  exclude: Set<string> = new Set(),
): Attribute[] {
  if (!record) return [];
  return Object.keys(entity.schema.shape)
    .filter((key) => !HIDDEN_FIELDS.has(key) && !exclude.has(key))
    .map((key) => ({ key, value: record[key] }));
}

/** Records of a to-many relation, filtered by the inverse FK. */
function RelationTable({ parentId, relation }: { parentId: string; relation: ResolvedRelation }) {
  const { module } = useFeature();
  const sdk = useSdk();
  const navigate = useNavigate();
  const target = relation.target!;
  const targetEntity = relation.targetEntity!;
  const inverse = (targetEntity.relations as Record<string, RelationDef>)[
    relation.relation.options.mappedBy!
  ]!;
  const fk = foreignKeyName(relation.relation.options.mappedBy!, inverse);
  const schema = targetEntity.schema as z.ZodObject<any>;

  return (
    <Container className="divide-y p-0">
      <DataTable<Row, ListResponse>
        id={`${targetEntity.modelName}:${fk}:${parentId}`}
        title={relation.label}
        schema={schema as unknown as z.ZodType<Row>}
        overrides={{ id: { hideLabel: true }, updated_at: { hideLabel: true }, deleted_at: { hideLabel: true } } as any}
        queryFn={(signal, params) =>
          sdk.client.fetch<ListResponse>(entityUrl(module, targetEntity), {
            signal,
            query: {
              limit: params.limit,
              offset: params.offset,
              order: params.order,
              fields: entityFields(module, target),
              ...toQueryFilters(params.filters, schema),
              [fk]: parentId,
            },
          })
        }
        selectFn={(resp) => ({ data: resp?.data, rowCount: resp?.metadata.count })}
        onRowClick={(_, row) => navigate(featurePath(target, "detail", { id: row.id })!)}
      />
    </Container>
  );
}

/**
 * Detail page of one record: its fields, a card per to-one relation and a
 * table per to-many relation. Renders `edit` in its outlet.
 */
export function TemplateDetail({ outlet }: RouteRenderContext) {
  const { module, feature, entity } = useFeature();
  const { id = "" } = useParams();
  const sdk = useSdk();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: record, isLoading } = useQuery({
    queryKey: [entity.modelName, id],
    queryFn: ({ signal }) =>
      sdk.client
        .fetch<{ data: Record<string, any> }>(entityUrl(module, entity, id), {
          signal,
          query: { fields: entityFields(module, feature) },
        })
        .then((r) => r.data),
  });

  const deletion = useDeleteMutation({
    invalidateKeys: [entity.modelName],
    deleteFn: async (recordId) => {
      await sdk.client.fetch(entityUrl(module, entity, recordId), { method: "DELETE" });
      navigate(featurePath(feature, "list")!, { replace: true });
    },
  });

  const relations = featureRelations(module, feature);
  const toOne = relations.filter((r) => ownsForeignKey(r.relation) || r.relation.kind === "hasOne");
  const toMany = relations.filter(
    (r) => (r.relation.kind === "hasMany" || r.relation.kind === "manyToMany") &&
      r.target && r.relation.options.mappedBy,
  );

  if (isLoading || !record) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-subtle">
          {isLoading ? t("common.loading", "Loading…") : t("common.not_found", "Not found")}
        </Text>
      </Container>
    );
  }

  const title = String(record[entity.display] || startCase(entity.name));

  return (
    <div className="flex flex-col gap-x-4 gap-y-3 xl:flex-row xl:items-start">
      <div className="flex w-full flex-col gap-y-3">
        <DetailsSection
          title={title}
          attributes={scalarAttributes(entity, record)}
          actions={[
            {
              id: "edit",
              label: t("common.edit", "Edit"),
              icon: <PencilSquare />,
              onClick: () => navigate(featurePath(feature, "edit", { id })!),
            },
            {
              id: "delete",
              label: t("common.delete", "Delete"),
              icon: <Trash />,
              onClick: () => deletion.mutateAsync(id),
            },
          ]}
        />
        {toMany.map((relation) => (
          <RelationTable key={relation.key} parentId={id} relation={relation} />
        ))}
      </div>
      {toOne.length > 0 && (
        <div className="flex w-full flex-col gap-y-3 xl:max-w-[440px]">
          {toOne.map((relation) => {
            const related = record[relation.key] as Record<string, unknown> | null | undefined;
            return (
              <DetailsSection
                key={relation.key}
                title={relation.label}
                attributes={
                  relation.targetEntity
                    ? scalarAttributes(relation.targetEntity, related, new Set(["created_at", "updated_at"]))
                    : []
                }
                actions={
                  relation.target && related?.id
                    ? [
                        {
                          id: "open",
                          label: t("common.open", "Open"),
                          icon: <ArrowUpRightOnBox />,
                          onClick: () =>
                            navigate(featurePath(relation.target!, "detail", { id: String(related.id) })!),
                        },
                      ]
                    : []
                }
              />
            );
          })}
        </div>
      )}
      {outlet}
    </div>
  );
}
