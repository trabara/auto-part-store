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

/** A label/value row; `node` replaces the formatted value (e.g. an image). */
export type Attribute = { key: string; label?: string; value: unknown; node?: ReactNode };

type DetailSectionProps = {
  title: string;
  attributes: Attribute[];
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

      {attributes.map(({ key, label, value, node }) => (
        <div
          key={key}
          className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4"
        >
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {label ?? _.startCase(key)}
          </Text>
          {node ? (
            <div className="justify-self-start">{node}</div>
          ) : (
            <Text size="small" leading="compact">
              {formatValue(value)}
            </Text>
          )}
        </div>
      ))}
    </Container>
  );
}
