import type { z } from "@medusajs/framework/zod";
import { getFieldUi, getZodShape } from "@repo/framework/utils";
import { ImageField, ImageThumbnail } from "../components/image-field";
import type { FeatureFieldOverrides } from "../types";

/**
 * Form, list-cell and filter overrides for fields carrying a `ui` hint
 * (`fields.image()` → upload widget, thumbnail cell, not filterable).
 */
export function fieldUiOverrides(schema: z.ZodTypeAny): FeatureFieldOverrides<any> {
  const overrides: FeatureFieldOverrides<any> = {};
  for (const [key, field] of Object.entries(getZodShape(schema))) {
    if (getFieldUi(field) !== "image") continue;
    overrides[key] = {
      isFiltrable: false,
      render: (props: { value: unknown; onChange: (value: unknown) => void; disabled?: boolean }) => (
        <ImageField
          value={props.value as string | null | undefined}
          onChange={props.onChange}
          disabled={props.disabled}
        />
      ),
      cell: (info: { getValue: () => unknown }) => <ImageThumbnail url={info.getValue() as string | null} />,
    } as FeatureFieldOverrides<any>[string];
  }
  return overrides;
}
