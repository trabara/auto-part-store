import type { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";
import { conditionAttribute, type BuildDate, type ConditionGroupInput, type FitmentMatch } from "../contract";
import {
  deserializeCondition,
  filterCompatible,
  hasConditions,
  serializeValue,
  summarizeConditionsByLocale,
  validateTree,
  windowContains,
} from "../core";
import { fitmentModels } from "./models/fitment";

/** What `replaceConditions` changed, so a workflow can undo it. */
export type ReplaceConditionsUndo = {
  fitment_id: string;
  previousSummary: Record<string, string> | null;
  createdGroups: string[];
  createdConditions: string[];
  oldGroups: string[];
  oldConditions: string[];
};

const collectCodes = (g: ConditionGroupInput): string[] => [
  ...g.conditions.map((c) => c.code),
  ...g.groups.flatMap(collectCodes),
];

const byRank = (a: { rank?: number }, b: { rank?: number }) => (a.rank ?? 0) - (b.rank ?? 0);

export default class FitmentModuleService extends MedusaService(fitmentModels) {
  // ── Condition trees ─────────────────────────────────────────────────────────

  /** A fitment's condition tree (several root groups are ANDed), or null. */
  @InjectManager()
  async getConditionTree(fitmentId: string, @MedusaContext() ctx: Context = {}): Promise<ConditionGroupInput | null> {
    await this.retrieveFitment(fitmentId, { select: ["id"] }, ctx);
    const groups: any[] = await this.listFitmentConditionGroups(
      { fitment_id: fitmentId },
      { relations: ["conditions", "conditions.attribute"], order: { rank: "ASC", created_at: "ASC" } },
      ctx,
    );
    if (!groups.length) return null;
    const build = (g: any): ConditionGroupInput => ({
      operator: g.operator,
      conditions: [...(g.conditions ?? [])].sort(byRank).map(deserializeCondition),
      groups: groups.filter((c) => c.parent_id === g.id).map(build),
    });
    const roots = groups.filter((g) => !g.parent_id).map(build);
    return roots.length === 1 ? roots[0]! : { operator: "and", conditions: [], groups: roots };
  }

  /**
   * Rewrites the stored summaries (every locale) of fitments with conditions,
   * e.g. after translations change. Returns how many were updated.
   */
  @InjectTransactionManager()
  async refreshConditionSummaries(@MedusaContext() ctx: Context = {}): Promise<number> {
    const groups = await this.listFitmentConditionGroups({}, { select: ["fitment_id"] }, ctx);
    const ids = [...new Set(groups.map((g) => g.fitment_id))];
    for (const id of ids) {
      const summary = summarizeConditionsByLocale(await this.getConditionTree(id, ctx));
      await this.updateFitments({ id, conditions_summary: summary } as any, ctx);
    }
    return ids.length;
  }

  /**
   * Replaces a fitment's condition tree as one document: validates it against
   * the attribute catalog, creates missing attributes, keeps the order (rank)
   * and the readable summary. Returns what changed, for `undoReplaceConditions`.
   */
  @InjectManager()
  async replaceConditions(
    fitmentId: string,
    tree: ConditionGroupInput | null,
    @MedusaContext() ctx: Context = {},
  ): Promise<{ summary: Record<string, string> | null; undo: ReplaceConditionsUndo }> {
    const errors = tree ? validateTree(tree) : [];
    if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join(" "));
    return await this.replaceConditions_(fitmentId, tree, ctx);
  }

  @InjectTransactionManager()
  protected async replaceConditions_(
    fitmentId: string,
    tree: ConditionGroupInput | null,
    @MedusaContext() ctx: Context = {},
  ): Promise<{ summary: Record<string, string> | null; undo: ReplaceConditionsUndo }> {
    const fitment = await this.retrieveFitment(fitmentId, { select: ["id", "conditions_summary"] }, ctx);
    const oldGroups = await this.listFitmentConditionGroups({ fitment_id: fitmentId }, { select: ["id"] }, ctx);
    const oldConditions = oldGroups.length
      ? await this.listFitmentConditions({ group_id: oldGroups.map((g) => g.id) }, { select: ["id"] }, ctx)
      : [];

    const keep = tree && hasConditions(tree) ? tree : null;
    const attributes = await this.ensureAttributes_(keep ? [...new Set(collectCodes(keep))] : [], ctx);

    if (oldConditions.length) await this.softDeleteFitmentConditions(oldConditions.map((c) => c.id), {}, ctx);
    if (oldGroups.length) await this.softDeleteFitmentConditionGroups(oldGroups.map((g) => g.id), {}, ctx);

    const createdGroups: string[] = [];
    const createdConditions: string[] = [];
    const create = async (group: ConditionGroupInput, parentId: string | null, rank = 0) => {
      const [row] = await this.createFitmentConditionGroups(
        [{ operator: group.operator as any, fitment_id: fitmentId, parent_id: parentId, rank }],
        ctx,
      );
      createdGroups.push(row!.id);
      if (group.conditions.length) {
        const rows = await this.createFitmentConditions(
          group.conditions.map((c, i) => ({
            group_id: row!.id,
            rank: i,
            attribute_id: attributes.get(c.code)!,
            operator: c.operator as any,
            value: serializeValue(c),
            value_to: c.value_to == null ? null : String(c.value_to),
            unit: conditionAttribute(c.code)?.unit ?? null,
          })),
          ctx,
        );
        createdConditions.push(...rows.map((r) => r.id));
      }
      let childRank = 0;
      for (const child of group.groups) if (hasConditions(child)) await create(child, row!.id, childRank++);
    };
    if (keep) await create(keep, null);

    // In every locale, from the translations the domain registered.
    const summary = summarizeConditionsByLocale(keep);
    await this.updateFitments({ id: fitmentId, conditions_summary: summary } as any, ctx);

    return {
      summary,
      undo: {
        fitment_id: fitmentId,
        previousSummary: (fitment as any).conditions_summary ?? null,
        createdGroups,
        createdConditions,
        oldGroups: oldGroups.map((g) => g.id),
        oldConditions: oldConditions.map((c) => c.id),
      },
    };
  }

  /** Reverts a `replaceConditions` (workflow compensation). */
  @InjectTransactionManager()
  async undoReplaceConditions(undo: ReplaceConditionsUndo, @MedusaContext() ctx: Context = {}): Promise<void> {
    if (undo.createdConditions.length) await this.deleteFitmentConditions(undo.createdConditions, ctx);
    if (undo.createdGroups.length) await this.deleteFitmentConditionGroups(undo.createdGroups, ctx);
    if (undo.oldGroups.length) await this.restoreFitmentConditionGroups(undo.oldGroups, {}, ctx);
    if (undo.oldConditions.length) await this.restoreFitmentConditions(undo.oldConditions, {}, ctx);
    await this.updateFitments({ id: undo.fitment_id, conditions_summary: undo.previousSummary } as any, ctx);
  }

  /** Attribute ids by code, created from the catalog on first use. */
  @InjectTransactionManager()
  protected async ensureAttributes_(codes: string[], @MedusaContext() ctx: Context = {}): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    if (!codes.length) return ids;
    for (const a of await this.listAutomotiveAttributes({ code: codes }, {}, ctx)) ids.set(a.code, a.id);
    const missing = codes.filter((code) => !ids.has(code));
    if (missing.length) {
      const created = await this.createAutomotiveAttributes(
        missing.map((code) => {
          const attr = conditionAttribute(code)!;
          return { code, name: attr.label, data_type: attr.data_type as any, default_unit: attr.unit ?? null, category: attr.group ?? null };
        }),
        ctx,
      );
      for (const a of created) ids.set(a.code, a.id);
    }
    return ids;
  }

  // ── Matching ────────────────────────────────────────────────────────────────

  /**
   * Fitments of a vehicle that apply to it, grouped by variant: production
   * window (narrowed by `build` when known) and condition groups evaluated
   * against `vehicle` (its fields by attribute code).
   */
  @InjectManager()
  async findMatching(
    vehicleId: string,
    vehicle: Record<string, any>,
    build?: BuildDate,
    @MedusaContext() ctx: Context = {},
  ): Promise<Map<string, FitmentMatch[]>> {
    const fitments = (
      await this.listFitments(
        { vehicle_id: vehicleId },
        {
          select: ["id", "variant_id", "quantity", "from_year", "from_month", "to_year", "to_month", "notes", "conditions_summary"],
          relations: ["position"],
        },
        ctx,
      )
    ).filter((f: any) => windowContains(f, build)) as any[];
    if (!fitments.length) return new Map();

    const groups: any[] = await this.listFitmentConditionGroups(
      { fitment_id: fitments.map((f) => f.id) },
      { relations: ["conditions", "conditions.attribute"] },
      ctx,
    );
    let compatible = fitments;
    if (groups.length) {
      const nodes = new Map(groups.map((g) => [g.id, { ...g, children: [] as any[] }]));
      const roots = new Map<string, any[]>();
      for (const g of nodes.values()) {
        if (g.parent_id && nodes.has(g.parent_id)) nodes.get(g.parent_id)!.children.push(g);
        else roots.set(g.fitment_id, [...(roots.get(g.fitment_id) ?? []), g]);
      }
      const ids = new Set(
        filterCompatible(
          fitments.map((f) => ({ ...f, conditionGroups: roots.get(f.id) ?? [] })),
          vehicle,
        ).map((f: any) => f.id),
      );
      compatible = fitments.filter((f) => ids.has(f.id));
    }

    const byVariant = new Map<string, FitmentMatch[]>();
    for (const f of compatible) {
      const match: FitmentMatch = {
        id: f.id,
        variant_id: f.variant_id,
        quantity: f.quantity,
        from_year: f.from_year,
        from_month: f.from_month,
        to_year: f.to_year,
        to_month: f.to_month,
        notes: f.notes,
        conditions: f.conditions_summary ?? null,
        position: f.position ? { id: f.position.id, code: f.position.code, name: f.position.name } : null,
      };
      byVariant.set(f.variant_id, [...(byVariant.get(f.variant_id) ?? []), match]);
    }
    return byVariant;
  }
}
