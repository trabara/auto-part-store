// The production-window rule: does a fitment's window contain a build date?
import type { BuildDate } from "../../contract/matching";

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
