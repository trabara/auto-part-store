import type { ConditionGroupInput } from "../../contract/conditions";

/** Whether a tree has any condition (empty groups don't count). */
export const hasConditions = (tree: ConditionGroupInput | null | undefined): boolean =>
  !!tree && (tree.conditions.length > 0 || tree.groups.some(hasConditions));
