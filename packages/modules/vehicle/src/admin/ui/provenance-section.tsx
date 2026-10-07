// "Provenance" on a catalog record's page: how far its values can be
// trusted, when a source last confirmed it, and where they came from.
import { Badge, Container, Heading, Text } from "@medusajs/ui";
import { useLabels } from "@repo/dashboard/module";
import type { SourceRef } from "@repo/module-vehicle/contract";
import { useTranslation } from "react-i18next";
import { useStewardTexts } from "./use-steward-texts";

const TIER_COLOR: Record<string, "grey" | "orange" | "blue" | "green" | "purple"> = {
  DRAFT: "grey",
  RESEARCH: "orange",
  REFERENCE: "blue",
  LICENSED: "green",
  HUMAN: "purple",
};

export function ProvenanceSection({ entity, record }: { entity: string; record: Record<string, any> }) {
  const text = useStewardTexts();
  const labels = useLabels();
  const { i18n } = useTranslation();
  const date = (value: string | Date) => new Date(value).toLocaleDateString(i18n.language);
  const sources = (record.sources ?? []) as SourceRef[];
  const tier = record.source_tier as string | undefined;
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{text("provenance", "title")}</Heading>
        {tier && <Badge color={TIER_COLOR[tier] ?? "grey"}>{labels.value(entity as any, "source_tier", tier)}</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {text("provenance", "verified")}
        </Text>
        <Text size="small" leading="compact">
          {record.verified_at ? date(record.verified_at) : text("provenance", "never")}
        </Text>
      </div>
      <div className="flex flex-col gap-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {text("provenance", "sources")}
        </Text>
        {sources.length ? (
          sources.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Text size="small" leading="compact" className="truncate">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive hover:underline">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle whitespace-nowrap">
                {labels.value(entity as any, "source_tier", s.tier)} · {date(s.at)}
              </Text>
            </div>
          ))
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            {text("provenance", "none")}
          </Text>
        )}
      </div>
    </Container>
  );
}
