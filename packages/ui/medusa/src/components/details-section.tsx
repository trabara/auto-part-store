import { EllipsisHorizontal } from "@medusajs/icons";
import {
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  Text,
} from "@medusajs/ui";
import _ from "lodash";
import { ReactNode } from "react";
import { formatValue } from "./many-relation-section";
import React from "react";

type DetailSectionProps = {
  title: string;
  attributes: [string, unknown][];
  actions?: {
    id: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  }[];
};
/**
 * A "one" relationship, or the entity's own scalar fields: rendered as a
 * label/value details block in the side column. Renders nothing when there
 * are no entries, so callers don't need to conditionally include it.
 */
export function DetailsSection({
  title,
  attributes,
  actions = [],
}: DetailSectionProps) {
  if (attributes.length === 0) {
    return null;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">{title}</Heading>
        {actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton variant="transparent">
                <EllipsisHorizontal />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {actions.map(({ id, label, icon, onClick }, index) => {
                return (
                  <React.Fragment key={id}>
                    <DropdownMenu.Item className="gap-2" onClick={onClick}>
                      {icon}
                      {label}
                    </DropdownMenu.Item>
                    {index < actions.length - 1 && <DropdownMenu.Separator />}
                  </React.Fragment>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      </div>

      {attributes
        .filter(
          ([key]) =>
            !["id", "created_at", "updated_at", "deleted_at"].includes(key),
        )
        .map(([key, value]) => (
          <div
            key={key}
            className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4"
          >
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {_.startCase(key)}
            </Text>
            <Text size="small" leading="compact">
              {formatValue(value)}
            </Text>
          </div>
        ))}
    </Container>
  );
}

type FieldKind = "scalar" | "many" | "one";

/**
 * Classifies a field by its data relationship, purely from the shape of
 * the value returned by the API (no relation metadata is available on
 * `config` today):
 * - an array of objects, or an empty array, is a "many" relation
 * - an array of primitives is treated as a scalar (e.g. tags: string[])
 * - a non-null object that isn't a Date is a "one" relation
 * - everything else is a scalar attribute of the entity itself
 */
export function classifyValue(value: unknown): FieldKind {
  if (Array.isArray(value)) {
    const [first] = value;
    const looksLikeObjectCollection =
      value.length === 0 ||
      (typeof first === "object" && first !== null && !(first instanceof Date));
    return looksLikeObjectCollection ? "many" : "scalar";
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return "one";
  }

  return "scalar";
}
