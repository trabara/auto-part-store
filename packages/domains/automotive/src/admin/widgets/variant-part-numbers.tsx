// "Part numbers" on the product variant page: the variant's MPN, OE,
// competitor and former numbers, with its brand (from the shared "Brand"
// option) next to the title.
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import type { AdminProductVariant, DetailWidgetProps } from "@medusajs/framework/types";
import { Badge, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useSdk } from "@repo/dashboard/common";
import { EntityPanel, Module, entityUrl } from "@repo/dashboard/module";
import { partsAdmin as parts } from "@repo/module-parts/admin";
import { Brand } from "@repo/module-parts/entities";

function VariantBrand({ variant }: { variant: AdminProductVariant }) {
  const sdk = useSdk();
  const valueIds = (variant.options ?? []).map((o: any) => o.id).filter(Boolean) as string[];
  const { data: brand } = useQuery({
    queryKey: [Brand.modelName, "variant", variant.id, valueIds],
    enabled: valueIds.length > 0,
    queryFn: ({ signal }) =>
      sdk.client
        .fetch<{ data: Record<string, any>[] }>(entityUrl(parts, Brand), {
          signal,
          query: { option_value_id: valueIds, fields: "id,name,logo,kind", limit: 1 },
        })
        .then((r) => r.data[0] ?? null),
  });
  if (!brand) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        No brand
      </Text>
    );
  }
  return (
    <div className="flex items-center gap-x-2">
      {brand.logo && (
        <img src={brand.logo} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
      )}
      <Badge size="2xsmall">{brand.name}</Badge>
    </div>
  );
}

export default function VariantPartNumbersWidget({ data }: DetailWidgetProps<AdminProductVariant>) {
  return (
    <Module module={parts}>
      <EntityPanel
        module={parts}
        feature={parts.features.part_number}
        parent={{ field: "variant_id", value: data.id }}
        title="Part numbers"
        description="Its own number, OE references, competitor and former numbers."
        aside={<VariantBrand variant={data} />}
      />
    </Module>
  );
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
});
