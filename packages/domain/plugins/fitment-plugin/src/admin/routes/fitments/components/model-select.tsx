import { Select } from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { useQuery } from "@tanstack/react-query";
import { Model } from "@trabara/core/dtos";

const listModels = (signal: AbortSignal, params?: PageQueryParams) => {
  return sdk.client
    .fetch<PageResponse<Model>>("/admin/models", {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: "id,name",
      },
    })
    .then(({ data }) =>
      data.map((model) => ({
        label: model.name,
        value: model.id,
      })),
    );
};

export default function ModelSelect({
  defaultValue,
  onChange,
}: {
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const { data: models } = useQuery({
    queryKey: ["models"],
    queryFn: ({ signal }) =>
      listModels(signal, { limit: 100, offset: 0, order: "name" }),
  });
  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder="Select a model" />
      </Select.Trigger>
      <Select.Content>
        {models?.map((model) => (
          <Select.Item key={model.value} value={model.value}>
            {model.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
