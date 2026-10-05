import { Select } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { entityLabel, type EntityDef } from "@repo/framework/entity";
import { useSdk } from "../../common/context";

/** Sentinel for "no value" (Radix Select items cannot have an empty value). */
const NONE = "__none__";

export type RelationSelectProps = {
  /** Collection URL of the target entity (see `entityUrl`). */
  url: string;
  /** Target entity: options are labelled with its `label`. */
  entity: EntityDef<any, any, any>;
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  /** Offer an empty choice (nullable relations). */
  clearable?: boolean;
  limit?: number;
};

/** Picks a related record by id, labelled by the target entity's label. */
export function RelationSelect({
  url,
  entity,
  value,
  onChange,
  placeholder,
  clearable = false,
  limit = 100,
}: RelationSelectProps) {
  const sdk = useSdk();

  const { data } = useQuery({
    queryKey: [url, "relation-select", entity.label.fields, limit],
    queryFn: async ({ signal }) => {
      const fields = [...new Set(["id", ...entity.label.fields])].join(",");
      const { data } = await sdk.client.fetch<{ data: Record<string, any>[] }>(url, {
        signal,
        query: { fields, limit },
      });
      return data.map((item) => ({
        value: String(item.id),
        label: entityLabel(entity, item),
      }));
    },
  });

  return (
    <Select
      value={value ?? (clearable ? NONE : undefined)}
      onValueChange={(next) => onChange?.(next === NONE ? null : next)}
    >
      <Select.Trigger>
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        {clearable && <Select.Item value={NONE}>—</Select.Item>}
        {data?.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
