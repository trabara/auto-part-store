import { Container, Heading, Table, Text } from "@medusajs/ui";
import _ from "lodash";
import { useMemo } from "react";

export type ManyRelationSectionProps = {
  title: string;
  rows: Record<string, any>[];
};

/** A "many" relationship: rendered as a data table in the main column. */
export function ManyRelationSection({ title, rows }: ManyRelationSectionProps) {
  const columns = useMemo(() => {
    const keySet = new Set<string>();
    rows.forEach((row) =>
      Object.keys(row ?? {}).forEach((key) => keySet.add(key)),
    );
    // Cap the columns shown so wide relations stay readable; swap for an
    // explicit per-entity column list if this default isn't right.
    return Array.from(keySet).slice(0, 6);
  }, [rows]);

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{title}</Heading>
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Text size="small" className="text-ui-fg-subtle">
            No {title.toLowerCase()} yet
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.HeaderCell key={column}>
                  {_.startCase(column)}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row, index) => (
              <Table.Row key={row?.id ?? index}>
                {columns.map((column) => (
                  <Table.Cell key={column}>
                    {formatValue(row?.[column])}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
}

/**
 * Renders a single field value for display. Dates and ISO date strings are
 * localized, booleans become Yes/No, empty values become an em dash. Nested
 * objects/arrays inside a cell fall back to a compact stringified form —
 * this is a one-level-deep summary, not a recursive relation view.
 */
export function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-ui-fg-muted">—</span>;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  ) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }
  if (Array.isArray(value)) {
    return value.length ? (
      value.map(String).join(", ")
    ) : (
      <span className="text-ui-fg-muted">—</span>
    );
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
