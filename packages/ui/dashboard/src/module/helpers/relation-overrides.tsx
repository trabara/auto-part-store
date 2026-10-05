import type { FeatureDef, ModuleDef } from "@repo/framework/core";
import { foreignKeyName, ownsForeignKey } from "@repo/framework/entity";
import type { z } from "@medusajs/framework/zod";
import { getZodShape } from "@repo/framework/utils";
import { RelationSelect } from "../components/relation-select";
import type { FeatureFieldOverrides } from "../types";
import { entityUrl, featureRelations } from "../utils/routes";

/**
 * Form overrides turning each FK field of `schema` (e.g. `engine_id`) into a
 * picker over the related entity, labelled by its `display` field. Targets
 * that are not features of the module are left as plain inputs.
 */
export function relationOverrides(
  module: ModuleDef,
  feature: FeatureDef,
  schema: z.ZodTypeAny,
): FeatureFieldOverrides<any> {
  const shape = getZodShape(schema);
  const overrides: FeatureFieldOverrides<any> = {};

  for (const rel of featureRelations(module, feature)) {
    if (!ownsForeignKey(rel.relation) || !rel.targetEntity) continue;
    const fk = foreignKeyName(rel.key, rel.relation);
    if (!(fk in shape)) continue;
    const target = rel.targetEntity;

    overrides[fk] = {
      label: rel.label,
      render: (props: { value: unknown; onChange: (value: unknown) => void }) => (
        <RelationSelect
          url={entityUrl(module, target)}
          displayField={target.display}
          value={(props.value as string | null | undefined) ?? null}
          onChange={props.onChange}
          clearable={rel.relation.options.nullable === true}
          placeholder={`Select ${rel.label.toLowerCase()}`}
        />
      ),
    };
  }
  return overrides;
}
