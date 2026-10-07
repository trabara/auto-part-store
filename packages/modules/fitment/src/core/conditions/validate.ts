import { MAX_GROUP_DEPTH, type ConditionGroupInput, type ConditionMessageKey, type ConditionTexts } from "../../contract/conditions";
import { conditionAttribute } from "../../contract/ports";
import { isListOperator, OPERATORS_BY_TYPE } from "./operators";
import { englishConditionTexts } from "./texts";

/** Human-readable problems in a tree (empty when valid). */
export function validateTree(
  tree: ConditionGroupInput,
  texts: ConditionTexts = englishConditionTexts,
  depth = 1,
  path = texts.message("root"),
): string[] {
  const m = texts.message;
  const errors: string[] = [];
  if (depth > MAX_GROUP_DEPTH) return [`${path}: ${m("tooDeep", { max: MAX_GROUP_DEPTH })}`];
  tree.conditions.forEach((c, i) => {
    const where = `${path} › #${i + 1}`;
    const add = (key: ConditionMessageKey, vars: Record<string, string | number> = {}) =>
      errors.push(`${where}: ${m(key, vars)}`);
    const attr = conditionAttribute(c.code);
    if (!attr) return add("unknownAttribute", { code: c.code });
    const label = texts.attribute(attr);
    if (!OPERATORS_BY_TYPE[attr.data_type].includes(c.operator)) {
      return add("badOperator", { attr: label, op: texts.operator(c.operator) });
    }
    const values = Array.isArray(c.value) ? c.value : [c.value];
    if (isListOperator(c.operator) && (!Array.isArray(c.value) || !c.value.length)) return add("needsValues", { attr: label });
    if (!isListOperator(c.operator) && Array.isArray(c.value)) return add("needsSingle", { attr: label });
    if (values.some((v) => v === "" || v == null)) return add("needsValue", { attr: label });
    if (attr.data_type === "enum") {
      const allowed = new Set(attr.values!.map((v) => v.value));
      const bad = values.filter((v) => !allowed.has(String(v)));
      if (bad.length) add("badValue", { value: bad.join(", "), attr: label.toLowerCase() });
    }
    if (attr.data_type === "number") {
      if (values.some((v) => !Number.isFinite(Number(v)))) add("notNumber", { attr: label });
      if (c.operator === "between") {
        if (c.value_to == null || !Number.isFinite(Number(c.value_to))) add("needsUpper", { attr: label });
        else if (Number(c.value_to) < Number(c.value)) add("upperBelow", { attr: label });
      }
    }
  });
  tree.groups.forEach((g, i) => errors.push(...validateTree(g, texts, depth + 1, `${path} › ${m("group", { n: i + 1 })}`)));
  return errors;
}
