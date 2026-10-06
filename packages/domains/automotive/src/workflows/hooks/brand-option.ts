// Sold brands own the values of the shared "Brand" product option: variants
// pick a brand as an option value (catalog model B). These hooks keep the two
// in sync inside the framework's create / update / delete workflows. Domain
// hook (parts ↔ Medusa product module): loaded with the domain's workflows.
import type { IProductModuleService } from "@medusajs/framework/types";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { PARTS_MODULE, type PartsModuleService } from "@repo/module-parts";
import { BrandKind } from "@repo/module-parts/entities";

export const BRAND_OPTION_TITLE = "Brand";

type BrandRow = { id: string; name: string; kind: BrandKind; option_value_id: string | null };

const sold = (kind: BrandKind | undefined) => kind !== BrandKind.OE;
const product = (ctx: HookContext) => ctx.container.resolve<IProductModuleService>(Modules.PRODUCT);
const parts = (ctx: HookContext) => ctx.container.resolve<PartsModuleService>(PARTS_MODULE);

/** The shared (non-exclusive) "Brand" option, created on first use. */
async function brandOptionId(ctx: HookContext): Promise<string> {
  const [option] = await product(ctx).listProductOptions({
    title: BRAND_OPTION_TITLE,
    is_exclusive: false,
  });
  if (option) return option.id;
  const created = await product(ctx).createProductOptions({
    title: BRAND_OPTION_TITLE,
    values: [],
    is_exclusive: false,
  });
  return created.id;
}

/**
 * Option values for these brands: existing values with the same name are
 * adopted, missing ones created. Returns value ids by brand id, and the ids
 * created here (the only ones a rollback deletes).
 */
async function ensureValues(ctx: HookContext, brands: BrandRow[]) {
  const optionId = await brandOptionId(ctx);
  const existing: { id: string; value: string }[] = await product(ctx).listProductOptionValues({
    option_id: optionId,
  });
  const byValue = new Map(existing.map((v) => [v.value.toLowerCase(), v.id]));
  const missing = brands.filter((b) => !byValue.has(b.name.toLowerCase()));
  const created: { id: string; value: string }[] = missing.length
    ? await product(ctx).createProductOptionValues(
        missing.map((b) => ({ value: b.name, option_id: optionId })),
      )
    : [];
  for (const v of created) byValue.set(v.value.toLowerCase(), v.id);
  const valueIds = new Map(brands.map((b) => [b.id, byValue.get(b.name.toLowerCase())!]));
  return { valueIds, createdIds: created.map((v) => v.id) };
}

/** Refuses when a brand's option value is still picked by variants. */
async function assertUnused(ctx: HookContext, brands: BrandRow[], action: string) {
  const withValue = brands.filter((b) => b.option_value_id);
  if (!withValue.length) return;
  const values: { id: string; variants?: unknown[] }[] = await product(ctx).listProductOptionValues(
    { id: withValue.map((b) => b.option_value_id!) },
    { relations: ["variants"] },
  );
  for (const brand of withValue) {
    const used = values.find((v) => v.id === brand.option_value_id)?.variants?.length ?? 0;
    if (used) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Brand ${brand.name} is used by ${used} variant${used === 1 ? "" : "s"}; ${action}.`,
      );
    }
  }
}

onEntity("Brand", {
  created: {
    async run({ records }, ctx) {
      const brands = (records as unknown as BrandRow[]).filter((b) => sold(b.kind));
      if (!brands.length) return { createdIds: [] };
      const { valueIds, createdIds } = await ensureValues(ctx, brands);
      await parts(ctx).updateBrands(brands.map((b) => ({ id: b.id, option_value_id: valueIds.get(b.id) })));
      for (const b of brands) b.option_value_id = valueIds.get(b.id)!;
      return { createdIds };
    },
    async compensate({ createdIds }, ctx) {
      if (createdIds.length) await product(ctx).deleteProductOptionValues(createdIds);
    },
  },

  updated: {
    async run({ records, previous }, ctx) {
      const before = new Map(previous.map((p) => [p.id, p]));
      const undo = {
        renamed: [] as { id: string; value: string }[],
        added: [] as { brandId: string; createdIds: string[] }[],
        removed: [] as { brandId: string; valueId: string }[],
      };
      for (const brand of records as unknown as BrandRow[]) {
        const prev: Partial<BrandRow> = before.get(brand.id) ?? {};
        const wasSold = "kind" in prev ? sold(prev.kind) : sold(brand.kind);
        const isSold = sold(brand.kind);

        if (wasSold && !isSold && brand.option_value_id) {
          // Became OE-only: its option value goes, unless variants use it.
          await assertUnused(ctx, [{ ...brand, name: prev.name ?? brand.name }], "keep it sold");
          await product(ctx).softDeleteProductOptionValues([brand.option_value_id]);
          await parts(ctx).updateBrands({ id: brand.id, option_value_id: null });
          undo.removed.push({ brandId: brand.id, valueId: brand.option_value_id });
          brand.option_value_id = null;
        } else if (isSold && !brand.option_value_id) {
          // Became sold (or never had a value): give it one.
          const { valueIds, createdIds } = await ensureValues(ctx, [brand]);
          await parts(ctx).updateBrands({ id: brand.id, option_value_id: valueIds.get(brand.id) });
          undo.added.push({ brandId: brand.id, createdIds });
          brand.option_value_id = valueIds.get(brand.id)!;
        } else if (isSold && "name" in prev && prev.name !== brand.name && brand.option_value_id) {
          // Renamed: the option value follows (variants keep pointing at it).
          await product(ctx).updateProductOptionValues(brand.option_value_id, { value: brand.name });
          undo.renamed.push({ id: brand.option_value_id, value: prev.name! });
        }
      }
      return undo;
    },
    async compensate(undo, ctx) {
      for (const { id, value } of undo.renamed) {
        await product(ctx).updateProductOptionValues(id, { value });
      }
      for (const { brandId, createdIds } of undo.added) {
        await parts(ctx).updateBrands({ id: brandId, option_value_id: null });
        if (createdIds.length) await product(ctx).deleteProductOptionValues(createdIds);
      }
      for (const { brandId, valueId } of undo.removed) {
        await product(ctx).restoreProductOptionValues([valueId]);
        await parts(ctx).updateBrands({ id: brandId, option_value_id: valueId });
      }
    },
  },

  async deleting({ ids }, ctx) {
    const brands: BrandRow[] = await parts(ctx).listBrands(
      { id: ids },
      { select: ["id", "name", "kind", "option_value_id"] },
    );
    await assertUnused(ctx, brands, "pick another brand on those variants first");
  },

  deleted: {
    async run({ ids }, ctx) {
      const brands: BrandRow[] = await parts(ctx).listBrands(
        { id: ids },
        { select: ["id", "option_value_id"], withDeleted: true },
      );
      const valueIds = brands.map((b) => b.option_value_id).filter((id): id is string => !!id);
      if (valueIds.length) await product(ctx).softDeleteProductOptionValues(valueIds);
      return { valueIds };
    },
    async compensate({ valueIds }, ctx) {
      if (valueIds.length) await product(ctx).restoreProductOptionValues(valueIds);
    },
  },
});
