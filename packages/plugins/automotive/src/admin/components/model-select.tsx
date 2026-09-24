import { Select } from "@medusajs/ui";
import { PageQueryParams } from "@repo/medusa-ui";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { sdk } from "../lib/sdk";

const listModels = (signal: AbortSignal, params?: PageQueryParams) => {
  return sdk.client
    .fetch<any>("/admin/models", {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: "id,name",
      },
    })
    .then(({ data }) =>
      data.map((model: any) => ({
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
  const { t } = useTranslation();
  const { data: models } = useQuery({
    queryKey: ["models"],
    queryFn: ({ signal }) =>
      listModels(signal, { limit: 100, offset: 0, order: "name" }),
  });
  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder={t("fitment.field.model.placeholder")} />
      </Select.Trigger>
      <Select.Content>
        {models?.map((model: any) => (
          <Select.Item key={model.value} value={model.value}>
            {model.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
