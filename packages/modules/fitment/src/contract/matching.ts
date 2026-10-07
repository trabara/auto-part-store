// What matching a vehicle returns (the storefront's view of a fitment).

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
  /** When it applies, by locale: `{ en: "Drive is front-wheel drive", … }` (null: always). */
  conditions: Readonly<Record<string, string>> | null;
  position: { id: string; code: string; name: string } | null;
};
