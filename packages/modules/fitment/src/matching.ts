// Fitment matching types and the production-window rule (isomorphic).

/** When the vehicle was built, if known (garage vehicles): narrows production windows. */
export type BuildDate = { year: number; month?: number | null };

/** A fitment that applies to a vehicle, as the storefront shows it. */
export type FitmentMatch = {
  id: string;
  variant_id: string;
  quantity: number;
  from_year: number | null;
  from_month: number | null;
  to_year: number | null;
  to_month: number | null;
  notes: string | null;
  /** When it applies, e.g. "Drive is front-wheel drive" (null: always). */
  conditions: string | null;
  position: { id: string; code: string; name: string } | null;
};

type Window = { from_year: number | null; from_month: number | null; to_year: number | null; to_month: number | null };

const point = (year: number, month?: number | null) => year * 100 + (month ?? 0);

/** Whether a fitment's production window contains the build date (open ends match). */
export function windowContains(f: Window, build?: BuildDate): boolean {
  if (!build) return true;
  // Without a build month, a window boundary month can't exclude the year.
  const at = (month?: number | null) => point(build.year, build.month ?? month);
  if (f.from_year != null && at(12) < point(f.from_year, f.from_month ?? 1)) return false;
  if (f.to_year != null && at(1) > point(f.to_year, f.to_month ?? 12)) return false;
  return true;
}
