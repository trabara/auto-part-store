// Replaces a fitment's condition tree as one document (the admin editor
// saves the whole tree). Missing attributes are created from the vehicle
// catalog; the fitment's readable summary is kept in sync.
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { FITMENT_MODULE } from "../modules/fitment";
import {
  deserializeCondition,
  hasConditions,
  serializeValue,
  summarizeConditions,
  vehicleAttribute,
  type ConditionGroupInput,
} from "../modules/fitment/conditions";

export type ReplaceFitmentConditionsInput = { fitment_id: string; tree: ConditionGroupInput | null };

type Container = { resolve: <T = any>(key: string) => T };

const collectCodes = (g: ConditionGroupInput): string[] => [
  ...g.conditions.map((c) => c.code),
  ...g.groups.flatMap(collectCodes),
];

/** A fitment's stored condition tree (several root groups are ANDed). */
export async function loadConditionTree(container: Container, fitmentId: string): Promise<ConditionGroupInput | null> {
  const svc = container.resolve<any>(FITMENT_MODULE);
  const groups: any[] = await svc.listFitmentConditionGroups(
    { fitment_id: fitmentId },
    { relations: ["conditions", "conditions.attribute"], order: { rank: "ASC", created_at: "ASC" } },
  );
  if (!groups.length) return null;
  const byRank = (a: { rank?: number }, b: { rank?: number }) => (a.rank ?? 0) - (b.rank ?? 0);
  const build = (g: any): ConditionGroupInput => ({
    operator: g.operator,
    conditions: [...(g.conditions ?? [])].sort(byRank).map(deserializeCondition),
    groups: groups.filter((c) => c.parent_id === g.id).map(build),
  });
  const roots = groups.filter((g) => !g.parent_id).map(build);
  return roots.length === 1 ? roots[0]! : { operator: "and", conditions: [], groups: roots };
}

export const replaceFitmentConditionsStep = createStep(
  "replace-fitment-conditions",
  async ({ fitment_id, tree }: ReplaceFitmentConditionsInput, { container }) => {
    const svc = container.resolve<any>(FITMENT_MODULE);
    const [fitment] = await svc.listFitments({ id: fitment_id }, { select: ["id", "conditions_summary"] });

    const oldGroups: { id: string }[] = await svc.listFitmentConditionGroups({ fitment_id }, { select: ["id"] });
    const oldConditions: { id: string }[] = oldGroups.length
      ? await svc.listFitmentConditions({ group_id: oldGroups.map((g) => g.id) }, { select: ["id"] })
      : [];

    // Attributes for the codes used (created from the catalog on first use).
    const keep = tree && hasConditions(tree) ? tree : null;
    const codes = keep ? [...new Set(collectCodes(keep))] : [];
    const attributes = new Map<string, string>();
    if (codes.length) {
      const existing: { id: string; code: string }[] = await svc.listAutomotiveAttributes({ code: codes });
      for (const a of existing) attributes.set(a.code, a.id);
      const missing = codes.filter((code) => !attributes.has(code));
      if (missing.length) {
        const created: { id: string; code: string }[] = await svc.createAutomotiveAttributes(
          missing.map((code) => {
            const attr = vehicleAttribute(code)!;
            return { code, name: attr.label, data_type: attr.data_type, default_unit: attr.unit ?? null, category: null };
          }),
        );
        for (const a of created) attributes.set(a.code, a.id);
      }
    }

    if (oldConditions.length) await svc.softDeleteFitmentConditions(oldConditions.map((c) => c.id));
    if (oldGroups.length) await svc.softDeleteFitmentConditionGroups(oldGroups.map((g) => g.id));

    const createdGroups: string[] = [];
    const createdConditions: string[] = [];
    const create = async (group: ConditionGroupInput, parentId: string | null, rank = 0) => {
      const [row] = await svc.createFitmentConditionGroups([{ operator: group.operator, fitment_id, parent_id: parentId, rank }]);
      createdGroups.push(row.id);
      if (group.conditions.length) {
        const rows = await svc.createFitmentConditions(
          group.conditions.map((c, i) => ({
            group_id: row.id,
            rank: i,
            attribute_id: attributes.get(c.code),
            operator: c.operator,
            value: serializeValue(c),
            value_to: c.value_to == null ? null : String(c.value_to),
            unit: vehicleAttribute(c.code)?.unit ?? null,
          })),
        );
        createdConditions.push(...rows.map((r: { id: string }) => r.id));
      }
      let childRank = 0;
      for (const child of group.groups) if (hasConditions(child)) await create(child, row.id, childRank++);
    };
    if (keep) await create(keep, null);

    const summary = summarizeConditions(keep);
    await svc.updateFitments({ id: fitment_id, conditions_summary: summary });

    return new StepResponse(
      { summary },
      {
        fitment_id,
        previousSummary: fitment?.conditions_summary ?? null,
        createdGroups,
        createdConditions,
        oldGroups: oldGroups.map((g) => g.id),
        oldConditions: oldConditions.map((c) => c.id),
      },
    );
  },
  async (undo, { container }) => {
    if (!undo) return;
    const svc = container.resolve<any>(FITMENT_MODULE);
    if (undo.createdConditions.length) await svc.deleteFitmentConditions(undo.createdConditions);
    if (undo.createdGroups.length) await svc.deleteFitmentConditionGroups(undo.createdGroups);
    if (undo.oldGroups.length) await svc.restoreFitmentConditionGroups(undo.oldGroups);
    if (undo.oldConditions.length) await svc.restoreFitmentConditions(undo.oldConditions);
    await svc.updateFitments({ id: undo.fitment_id, conditions_summary: undo.previousSummary });
  },
);

export const replaceFitmentConditionsWorkflow = createWorkflow(
  "replace-fitment-conditions",
  (input: ReplaceFitmentConditionsInput) => new WorkflowResponse(replaceFitmentConditionsStep(input)),
);
