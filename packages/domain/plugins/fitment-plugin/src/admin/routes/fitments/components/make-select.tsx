import { Select } from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { useQuery } from "@tanstack/react-query";
import { Make } from "@trabara/core/dtos";

const listMakes = (signal: AbortSignal, params?: PageQueryParams) => {
  return sdk.client
    .fetch<PageResponse<Make>>("/admin/makes", {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: "id,name",
      },
    })
    .then(({ data }) =>
      data.map((make) => ({
        label: make.name,
        value: make.id,
      })),
    );
};

export default function MakeSelect({
  defaultValue,
  onChange,
}: {
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const { data: makes } = useQuery({
    queryKey: ["makes"],
    queryFn: ({ signal }) =>
      listMakes(signal, { limit: 100, offset: 0, order: "name" }),
  });
  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder="Select a make" />
      </Select.Trigger>
      <Select.Content>
        {makes?.map((make) => (
          <Select.Item key={make.value} value={make.value}>
            {make.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
