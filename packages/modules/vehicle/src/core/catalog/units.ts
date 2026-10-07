// Units as sources write them, converted the catalog's way. Language models
// copy values as written (85 ch, 1.5 L); the conversion is done here.

/** Metric horsepower (PS, ch, CV) to kW. */
export const psToKw = (ps: number) => Math.round(ps * 0.73549875);

/** Mechanical horsepower (hp, bhp) to kW. */
export const hpToKw = (hp: number) => Math.round(hp * 0.7457);

/** Power as written ("85 ch", "63 kW", "150 hp") in kW; null when unknown. */
export function powerToKw(value: number | null | undefined, unit: string | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const u = (unit ?? "").trim().toLowerCase();
  if (u === "kw") return Math.round(value);
  if (["ch", "cv", "ps", "pk", "hk"].includes(u)) return psToKw(value);
  if (["hp", "bhp"].includes(u)) return hpToKw(value);
  return null;
}

/**
 * Displacement as written in cm³, only when exact: "1461 cm3" → 1461, but
 * "1.5 L" → null (a rounded litre figure is not a displacement).
 */
export function displacementToCc(value: number | null | undefined, unit: string | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const u = (unit ?? "").trim().toLowerCase().replace("³", "3");
  if (["cc", "cm3", "cm 3", "ccm"].includes(u)) return Math.round(value);
  // Litres with three decimals are exact (1.461 L); 1.5 L is a rounded figure.
  if (["l", "litre", "liter", "litres", "liters"].includes(u)) {
    return (String(value).split(".")[1] ?? "").length === 3 ? Math.round(value * 1000) : null;
  }
  return null;
}
