// Problems in a catalog file on its own (before looking at the database).
import type { CatalogFile } from "../../contract/catalog";
import { engineKey, generationKey, makeKey, modelKey } from "./keys";

const overlaps = (a: { year_start: number; year_end: number | null }, b: { year_start: number; year_end: number | null }) =>
  a.year_start <= (b.year_end ?? Infinity) && b.year_start <= (a.year_end ?? Infinity);

/** Human-readable problems, each prefixed with its path ("Renault › Clio › V: …"). */
export function validateCatalog(file: CatalogFile): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const references = new Map<string, string>();
  const once = (key: string, where: string, what: string) => {
    if (seen.has(key)) problems.push(`${where}: ${what} appears twice.`);
    seen.add(key);
  };

  for (const make of file.makes) {
    once(`make:${makeKey(make.name)}`, make.name, "make");
    for (const model of make.models) {
      const modelPath = `${make.name} › ${model.name}`;
      once(`model:${modelKey(make.name, model.name)}`, modelPath, "model");
      for (const gen of model.generations) {
        const genPath = `${modelPath} › ${gen.name}`;
        once(`generation:${generationKey(make.name, model.name, gen.name)}`, genPath, "generation");
        if (gen.year_end != null && gen.year_end < gen.year_start) problems.push(`${genPath}: the last year is before the first.`);
        gen.vehicles.forEach((v, i) => {
          const where = `${genPath} › #${i + 1}`;
          if (v.year_end != null && v.year_end < v.year_start) problems.push(`${where}: the last year is before the first.`);
          // Configurations fall within their generation (the vehicle module's rule).
          if (v.year_start < gen.year_start) problems.push(`${where}: starts (${v.year_start}) before its generation (${gen.year_start}).`);
          if (gen.year_end != null && (v.year_end == null || v.year_end > gen.year_end)) {
            problems.push(`${where}: ends after its generation (${gen.year_end}).`);
          }
          // Same specification, overlapping years: the exclusion constraint refuses it.
          gen.vehicles.slice(0, i).forEach((other, j) => {
            const same =
              engineKey(other.engine) === engineKey(v.engine) &&
              other.body_style === v.body_style &&
              other.doors === v.doors &&
              other.drive === v.drive &&
              other.transmission === v.transmission &&
              (other.trim ?? "").toLowerCase() === (v.trim ?? "").toLowerCase();
            if (same && overlaps(other, v)) problems.push(`${where}: same configuration as #${j + 1} with overlapping years.`);
          });
          for (const ref of v.references) {
            const key = `${ref.source}:${ref.external_id}`;
            const owner = references.get(key);
            if (owner) problems.push(`${where}: reference ${key} already used by ${owner}.`);
            else references.set(key, where);
          }
        });
      }
    }
  }
  return problems;
}
