import { Select } from "@medusajs/ui";
import { PageQueryParams } from "@repo/medusa-ui";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { sdk } from "../lib/sdk";

const listEngines = (signal: AbortSignal, params?: PageQueryParams) => {
  return sdk.client
    .fetch<any>("/admin/engines", {
      method: "GET",
      signal,
      query: {
        ...(params || {}),
        fields: "id,tech,type,size,fuel",
      },
    })
    .then(({ data }) =>
      data.map((engine: any) => ({
        label: engine.tech || `${engine.type} ${engine.size} ${engine.fuel}`,
        value: engine.id,
      })),
    );
};

export default function EngineSelect({
  defaultValue,
  onChange,
}: {
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const { data: engines } = useQuery({
    queryKey: ["engines"],
    queryFn: ({ signal }) => listEngines(signal, { limit: 100, offset: 0 }),
  });
  return (
    <Select value={defaultValue} onValueChange={onChange}>
      <Select.Trigger>
        <Select.Value placeholder={t("fitment.field.engine.placeholder")} />
      </Select.Trigger>
      <Select.Content>
        {engines?.map((engine: any) => (
          <Select.Item key={engine.value} value={engine.value}>
            {engine.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}
