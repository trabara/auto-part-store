// Editor for a fitment's condition tree: groups (all / any) of conditions on
// the attributes of the injected catalog, nestable. Inputs follow each
// attribute's type (enum, number, text).
import { Plus, Trash, XMark } from "@medusajs/icons";
import { Button, clx, IconButton, Input, Select, Text } from "@medusajs/ui";
import {
  isListOperator,
  MAX_GROUP_DEPTH,
  OPERATOR_LABELS,
  OPERATORS_BY_TYPE,
  conditionAttribute,
  conditionAttributes,
  type ConditionGroupInput,
  type ConditionInput,
  type ConditionOperator,
  type ConditionAttribute,
} from "@repo/module-fitment/conditions";

/** Catalog attributes by group, in catalog order ("" for ungrouped). */
function groupedAttributes() {
  const groups = new Map<string, ConditionAttribute[]>();
  for (const a of conditionAttributes()) groups.set(a.group ?? "", [...(groups.get(a.group ?? "") ?? []), a]);
  return [...groups];
}

/** A new condition on `attr` (default: the catalog's first) with sensible defaults. */
export function newCondition(attr: ConditionAttribute = conditionAttributes()[0]!): ConditionInput {
  const operator = OPERATORS_BY_TYPE[attr.data_type][0]!;
  const value = attr.data_type === "enum" ? attr.values![0]!.value : attr.data_type === "boolean" ? true : "";
  return { code: attr.code, operator, value, value_to: null };
}

export const emptyTree = (): ConditionGroupInput => ({ operator: "and", conditions: [newCondition()], groups: [] });

/** Keeps the value consistent when the operator changes (single ⇄ list). */
function withOperator(c: ConditionInput, operator: ConditionOperator, attr: ConditionAttribute): ConditionInput {
  const wasList = isListOperator(c.operator);
  const isList = isListOperator(operator);
  let value = c.value;
  if (isList && !wasList) value = c.value === "" ? [] : [c.value as string];
  if (!isList && wasList) value = (c.value as string[])[0] ?? (attr.data_type === "enum" ? attr.values![0]!.value : "");
  return { ...c, operator, value, value_to: operator === "between" ? c.value_to ?? null : null };
}

function ValueInput({ condition, attr, onChange }: { condition: ConditionInput; attr: ConditionAttribute; onChange: (c: ConditionInput) => void }) {
  const set = (patch: Partial<ConditionInput>) => onChange({ ...condition, ...patch });

  if (attr.data_type === "enum" && isListOperator(condition.operator)) {
    const selected = new Set((condition.value as string[]).map(String));
    return (
      <div className="flex flex-wrap gap-1.5">
        {attr.values!.map((v) => {
          const on = selected.has(v.value);
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (on) next.delete(v.value);
                else next.add(v.value);
                set({ value: attr.values!.map((x) => x.value).filter((x) => next.has(x)) });
              }}
              className={clx(
                "txt-compact-small rounded-md border px-2 py-1 transition-fg",
                on
                  ? "bg-ui-bg-interactive text-ui-fg-on-color border-transparent"
                  : "bg-ui-bg-field text-ui-fg-subtle border-ui-border-base hover:bg-ui-bg-field-hover",
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (attr.data_type === "enum") {
    return (
      <Select value={String(condition.value)} onValueChange={(value) => set({ value })}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {attr.values!.map((v) => (
            <Select.Item key={v.value} value={v.value}>
              {v.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    );
  }

  if (attr.data_type === "number") {
    const number = (raw: string) => (raw === "" ? "" : Number(raw));
    const unit = attr.unit ? <Text size="small" className="text-ui-fg-muted shrink-0">{attr.unit}</Text> : null;
    return (
      <div className="flex min-w-0 items-center gap-x-2">
        <Input
          style={{ minWidth: "5.5rem", flex: 1 }}
          type="number"
          placeholder={condition.operator === "between" ? "from" : "value"}
          value={String(condition.value)}
          onChange={(e) => set({ value: number(e.target.value) })}
        />
        {condition.operator === "between" && (
          <>
            <Text size="small" className="text-ui-fg-muted">and</Text>
            <Input
              style={{ minWidth: "5.5rem", flex: 1 }}
              type="number"
              placeholder="to"
              value={condition.value_to == null ? "" : String(condition.value_to)}
              onChange={(e) => set({ value_to: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </>
        )}
        {unit}
      </div>
    );
  }

  if (isListOperator(condition.operator)) {
    return (
      <Input
        placeholder="Comma-separated, e.g. GTI, R-Line"
        value={(condition.value as string[]).join(", ")}
        onChange={(e) => set({ value: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
      />
    );
  }
  return <Input value={String(condition.value)} onChange={(e) => set({ value: e.target.value })} />;
}

function ConditionRow({ condition, onChange, onRemove }: { condition: ConditionInput; onChange: (c: ConditionInput) => void; onRemove: () => void }) {
  const attr = conditionAttribute(condition.code) ?? conditionAttributes()[0]!;
  return (
    // Inline grid: the host admin's Tailwind may not generate arbitrary classes from plugin code.
    <div className="grid items-start gap-2" style={{ gridTemplateColumns: "minmax(0,10rem) minmax(0,8.5rem) minmax(12rem,1fr) auto" }}>
      <Select value={attr.code} onValueChange={(code) => onChange(newCondition(conditionAttribute(code)))}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {groupedAttributes().map(([group, attrs]) => (
            <Select.Group key={group}>
              {group && <Select.Label>{group}</Select.Label>}
              {attrs.map((a) => (
                <Select.Item key={a.code} value={a.code}>
                  {a.label}
                </Select.Item>
              ))}
            </Select.Group>
          ))}
        </Select.Content>
      </Select>
      <Select
        value={condition.operator}
        onValueChange={(op) => onChange(withOperator(condition, op as ConditionOperator, attr))}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {OPERATORS_BY_TYPE[attr.data_type].map((op) => (
            <Select.Item key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <ValueInput condition={condition} attr={attr} onChange={onChange} />
      <IconButton size="small" variant="transparent" type="button" aria-label="Remove condition" onClick={onRemove}>
        <XMark />
      </IconButton>
    </div>
  );
}

export function GroupEditor({
  group,
  onChange,
  onRemove,
  depth = 1,
}: {
  group: ConditionGroupInput;
  onChange: (g: ConditionGroupInput) => void;
  onRemove?: () => void;
  depth?: number;
}) {
  const setCondition = (i: number, c: ConditionInput) =>
    onChange({ ...group, conditions: group.conditions.map((x, j) => (j === i ? c : x)) });
  const setGroup = (i: number, g: ConditionGroupInput) =>
    onChange({ ...group, groups: group.groups.map((x, j) => (j === i ? g : x)) });

  return (
    <div className={clx("flex flex-col gap-y-3", depth > 1 && "border-ui-border-base rounded-lg border p-3")}>
      <div className="flex items-center justify-between gap-x-2">
        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">Fits when</Text>
          <Select value={group.operator} onValueChange={(op) => onChange({ ...group, operator: op as "and" | "or" })}>
            <Select.Trigger className="w-24">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="and">all</Select.Item>
              <Select.Item value="or">any</Select.Item>
            </Select.Content>
          </Select>
          <Text size="small" className="text-ui-fg-subtle">of these match:</Text>
        </div>
        {onRemove && (
          <IconButton size="small" variant="transparent" type="button" aria-label="Remove group" onClick={onRemove}>
            <Trash />
          </IconButton>
        )}
      </div>

      {group.conditions.map((c, i) => (
        <ConditionRow
          key={i}
          condition={c}
          onChange={(next) => setCondition(i, next)}
          onRemove={() => onChange({ ...group, conditions: group.conditions.filter((_, j) => j !== i) })}
        />
      ))}
      {group.groups.map((g, i) => (
        <GroupEditor
          key={`g${i}`}
          group={g}
          depth={depth + 1}
          onChange={(next) => setGroup(i, next)}
          onRemove={() => onChange({ ...group, groups: group.groups.filter((_, j) => j !== i) })}
        />
      ))}

      <div className="flex gap-x-2">
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={() => onChange({ ...group, conditions: [...group.conditions, newCondition()] })}
        >
          <Plus /> Condition
        </Button>
        {depth < MAX_GROUP_DEPTH && (
          <Button
            size="small"
            variant="secondary"
            type="button"
            onClick={() =>
              onChange({
                ...group,
                groups: [...group.groups, { operator: group.operator === "and" ? "or" : "and", conditions: [newCondition()], groups: [] }],
              })
            }
          >
            <Plus /> Group
          </Button>
        )}
      </div>
    </div>
  );
}
