// Trust between sources: which values an import may overwrite, how a
// record's sources accumulate, and how often it should be checked again.
import { SourceTier } from "../../contract/entities/enums";
import type { SourceRef } from "../../contract/entities/shared";

export const TIER_RANK: Record<SourceTier, number> = {
  [SourceTier.DRAFT]: 0,
  [SourceTier.RESEARCH]: 1,
  [SourceTier.REFERENCE]: 2,
  [SourceTier.LICENSED]: 3,
  [SourceTier.HUMAN]: 4,
};

const rank = (tier: string | null | undefined) => TIER_RANK[(tier as SourceTier) ?? SourceTier.DRAFT] ?? 0;

/** A source of `incoming` tier may replace a value set by `record` tier: higher only, never staff edits. */
export const mayOverwrite = (record: string | null | undefined, incoming: string) =>
  record !== SourceTier.HUMAN && rank(incoming) > rank(record);

/**
 * A blank value of a record may be filled from a source of `incoming` tier:
 * never on a staff edit, and a blank end year ("still produced", a claim)
 * only from a higher tier.
 */
export const mayFill = (record: string | null | undefined, incoming: string, field: string) =>
  record !== SourceTier.HUMAN && (field !== "year_end" || mayOverwrite(record, incoming));

/** The higher of two tiers. */
export const higherTier = (a: string | null | undefined, b: string): SourceTier =>
  (rank(a) >= rank(b) ? (a ?? SourceTier.DRAFT) : b) as SourceTier;

/** Newest first, one entry per source (name and url), at most `cap`. */
export function mergeSources(existing: readonly SourceRef[] | null | undefined, incoming: SourceRef, cap = 5): SourceRef[] {
  const same = (s: SourceRef) => s.name === incoming.name && (s.url ?? null) === (incoming.url ?? null);
  return [incoming, ...(existing ?? []).filter((s) => !same(s))].slice(0, cap);
}

/** Days until a record of this tier is checked against a source again (null: never, staff owns it). */
export const VERIFY_INTERVAL_DAYS: Record<SourceTier, number | null> = {
  [SourceTier.DRAFT]: 90,
  [SourceTier.RESEARCH]: 90,
  [SourceTier.REFERENCE]: 365,
  [SourceTier.LICENSED]: 730,
  [SourceTier.HUMAN]: null,
};

/** When a record is due for verification (now when never verified; null when never). */
export function verifyDue(tier: string | null | undefined, verifiedAt: Date | string | null | undefined, now = new Date()): Date | null {
  const key = (tier ?? SourceTier.DRAFT) as SourceTier;
  const days = key in VERIFY_INTERVAL_DAYS ? VERIFY_INTERVAL_DAYS[key] : 90;
  if (days == null) return null;
  if (!verifiedAt) return now;
  return new Date(new Date(verifiedAt).getTime() + days * 86_400_000);
}
