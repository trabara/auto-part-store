import { Select } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { kebabCase } from "lodash";
import { useSdk } from "../../common/context";

type RelationSelectProps = {
  defaultValue?: string;
  entity: string;
  fields: string[];
  mapper: <T>(item: T) => { label: string; value: string };
  onChange?: (value: string) => void;
  path: string;
  placeholder?: string;
};
export function RelationSelect({
  defaultValue,
  entity,
  fields = ["id"],
  mapper,
  onChange,
  path,
  placeholder,
}: RelationSelectProps) {
  const sdk = useSdk();

  const { data } = useQuery({
    queryKey: [[entity, "select"]],
    queryFn: async ({ signal }) => {
      const uri = `admin${path}/${kebabCase(entity)}`;
      const { data } = await sdk.client.fetch<{ data: [] }>(uri, {
        signal,
        query: {
          fields: fields.join(","),
        },
      });
      return data.map(mapper);
    },
  });

  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        {data?.map((make: any) => (
          <Select.Item key={make.value} value={make.value}>
            {make.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
