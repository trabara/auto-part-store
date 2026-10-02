import { Select } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { kebabCase } from "lodash";
import { useSdk } from "../../common/context";

type RelationSelectProps = {
  defaultValue?: string;
  entity: string;
  fields: string[];
  /** Field on the target entity used as the option label (default: "name") */
  displayField?: string;
  onChange?: (value: string) => void;
  path: string;
  placeholder?: string;
};

export function RelationSelect({
  defaultValue,
  entity,
  fields = ["id"],
  displayField = "name",
  onChange,
  path,
  placeholder,
}: RelationSelectProps) {
  const sdk = useSdk();

  const { data } = useQuery({
    queryKey: [[entity, "select", displayField]],
    queryFn: async ({ signal }) => {
      const uri = `admin${path}/${kebabCase(entity)}`;
      const { data } = await sdk.client.fetch<{ data: any[] }>(uri, {
        signal,
        query: {
          fields: fields.join(","),
        },
      });
      return data.map((item) => ({
        value: item.id,
        label: item[displayField] ?? item.name ?? item.id,
      }));
    },
  });

  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        {data?.map((option: any) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
