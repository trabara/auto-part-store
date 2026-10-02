import { z } from "@medusajs/framework/zod";
import { startCase } from "lodash";
import { useTranslation } from "react-i18next";
import { useSdk } from "../../common/context";
import { useModule } from "../context/module";
import { DataTable } from "./data-table";

type RelationManyTableProps = {
  /** The parent entity key (e.g. "vehicle_make") */
  parentEntity: string;
  /** The relation field key on the parent schema (e.g. "models") */
  relationKey: string;
  /** The target entity key in the module's features map (e.g. "vehicle_model") */
  targetEntity: string;
  /** Fields to display as columns */
  fields: string[];
};

/**
 * Renders a has-many relation as a data table inside a form field.
 *
 * Fetches only records belonging to the current parent entity by
 * passing a `<parent>_id` filter when a parent record exists (edit mode).
 * In create mode (no parent id yet) the table renders empty.
 */
export function RelationManyTable({
  parentEntity,
  relationKey,
  targetEntity,
  fields,
}: RelationManyTableProps) {
  const sdk = useSdk();
  const { t } = useTranslation();
  const module = useModule<{ id?: string }>();
  const parentId = module.state?.id;

  // Build a loose schema for column rendering; actual data comes from API
  const schema = z.object(
    fields.reduce(
      (acc, f) => {
        acc[f] = z.string().optional();
        return acc;
      },
      {} as Record<string, z.ZodTypeAny>,
    ),
  ) as unknown as z.ZodType<{ id: string }>;

  const endpoint = `/admin${module.path}/${targetEntity.replace(/_/g, "-")}`;
  const parentFilterKey = `${parentEntity}_id`;

  return (
    <DataTable<{ id: string }, { data: { id: string }[]; metadata: { count: number } }>
      id={`${parentEntity}_${relationKey}`}
      title={startCase(relationKey)}
      schema={schema}
      overrides={{}}
      queryFn={async (signal, params) => {
        const query: Record<string, unknown> = {
          ...params,
          limit: params.limit ?? 10,
          fields,
        };
        if (parentId) {
          query[parentFilterKey] = parentId;
        }
        return sdk.client.fetch<{
          data: { id: string }[];
          metadata: { count: number };
        }>(endpoint, { signal, query });
      }}
      selectFn={(resp) => ({
        data: resp?.data ?? [],
        rowCount: resp?.metadata?.count ?? 0,
      })}
    />
  );
}
