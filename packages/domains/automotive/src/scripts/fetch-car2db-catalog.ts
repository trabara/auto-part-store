// Builds vehicle catalog files (`vehicle-catalog@1`) from car2db for the models
// of a market catalog: generations, engines and configurations (trims), one
// file per make. Plain Node (no database); responses are cached on disk.
//
//   CAR2DB_API_KEY=… node .medusa/server/src/scripts/fetch-car2db-catalog.js \
//     --market data/vehicle-catalog/tunisia --out data/vehicle-catalog/tunisia-car2db \
//     [--makes Audi,BMW] [--cache .cache/car2db]
//
// Model names that differ between the market catalog and car2db go in
// <out>/model-map.json: { "Audi": { "A3 Sportback": { "model": "A3",
// "series": "sportback|hatchback 5" } } } — car2db keeps body variants as
// series of one model; `series` (a case-insensitive regex) selects them, and
// a model mapped without `series` gets the series no sibling claims.
// Unmatched models and unmapped values are listed in <out>/report.json.
import fs from "node:fs";
import path from "node:path";
import { CatalogFileSchema } from "@repo/module-vehicle/contract";
import { validateCatalog } from "@repo/module-vehicle/core";
import { car2dbToCatalog, type Car2dbModelData } from "../core/catalog-sources/car2db";

const BASE = "https://v3.api.car2db.com";
const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Milliseconds between API requests (CAR2DB_PACE_MS, default 1 s). */
const pace = Number(process.env.CAR2DB_PACE_MS ?? 1000);

/**
 * Milliseconds to wait from a Retry-After header: seconds, an HTTP date, or
 * (as car2db sends) an epoch timestamp in ms or s; between 1 s and 10 min.
 */
function retryAfter(header: string | null): number | null {
  if (!header) return null;
  const n = Number(header);
  let ms: number;
  if (Number.isFinite(n)) ms = n > 1e12 ? n - Date.now() : n > 1e9 ? n * 1000 - Date.now() : n * 1000;
  else ms = Date.parse(header) - Date.now();
  return Number.isFinite(ms) ? Math.min(Math.max(ms, 1000), 600_000) : null;
}

export async function fetchCar2dbCatalog() {
  const key = process.env.CAR2DB_API_KEY;
  if (!key) throw new Error("CAR2DB_API_KEY is not set");
  const market = path.resolve(arg("market", "data/vehicle-catalog/tunisia")!);
  const out = path.resolve(arg("out", "data/vehicle-catalog/tunisia-car2db")!);
  const cacheDir = path.resolve(arg("cache", ".cache/car2db")!);
  const only = arg("makes")?.split(",").map((m) => norm(m));
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  let requests = 0;

  const get = async (url: string): Promise<any> => {
    const file = path.join(cacheDir, url.replace(/[^a-z0-9]+/gi, "_") + ".json");
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
    let res: Response;
    for (let attempt = 0; ; attempt++) {
      await sleep(pace);
      requests++;
      res = await fetch(BASE + url, {
        headers: {
          Authorization: `Bearer ${key}`,
          Referer: process.env.CAR2DB_REFERER ?? "https://localhost",
          Accept: "application/ld+json",
        },
      });
      // Rate limited: wait (Retry-After, else exponential backoff) and retry.
      if (res.status === 429 && attempt < 6) {
        const wait = retryAfter(res.headers.get("retry-after")) ?? 2000 * 2 ** attempt;
        console.warn(`[car2db] rate limited, waiting ${Math.round(wait / 1000)} s`);
        await sleep(wait);
        continue;
      }
      break;
    }
    if (!res.ok) throw new Error(`car2db ${url}: HTTP ${res.status}`);
    const body = await res.json();
    fs.writeFileSync(file, JSON.stringify(body));
    return body;
  };
  const all = async (url: string): Promise<any[]> => {
    const items: any[] = [];
    for (let page = 1; ; page++) {
      const d = await get(`${url}${url.includes("?") ? "&" : "?"}itemsPerPage=1000&page=${page}`);
      const members = d.member ?? d["hydra:member"] ?? [];
      items.push(...members);
      if (!members.length || items.length >= (d.totalItems ?? items.length)) return items;
    }
  };

  const modelMapFile = path.join(out, "model-map.json");
  const modelMap: Record<string, Record<string, string | { model: string; series?: string }>> = fs.existsSync(modelMapFile)
    ? JSON.parse(fs.readFileSync(modelMapFile, "utf8"))
    : {};
  const report: { requests?: number; makes: Record<string, unknown> } = { makes: {} };
  // Cars (type 1) and light commercial vehicles (type 2, when the key may read them).
  const car2dbMakes = [...(await all("/makes?typeId=1"))];
  try {
    car2dbMakes.push(...(await all("/makes?typeId=2")));
  } catch (e) {
    console.warn(`[car2db] light commercial vehicles skipped: ${(e as Error).message}`);
  }

  for (const fileName of fs.readdirSync(market).filter((f) => f.endsWith(".json")).sort()) {
    const catalog = CatalogFileSchema.parse(JSON.parse(fs.readFileSync(path.join(market, fileName), "utf8")));
    for (const make of catalog.makes) {
      if (only && !only.includes(norm(make.name))) continue;
      const matches = car2dbMakes.filter((m) => norm(m.name) === norm(make.name));
      if (!matches.length) {
        report.makes[make.name] = { status: "make not in car2db (for this key)" };
        continue;
      }
      const c2dModels: any[] = [];
      for (const m of matches) c2dModels.push(...(await all(`/models?makeId=${m.id}`)));
      const byName = new Map(c2dModels.map((m) => [norm(m.name), m]));
      const data: Car2dbModelData[] = [];
      const unmatched: { model: string; candidates: string[] }[] = [];
      // Our models by car2db model, each with its series filter (if any).
      const claims = new Map<number, { model: (typeof make.models)[number]; series?: RegExp }[]>();
      for (const model of make.models) {
        const entry = modelMap[make.name]?.[model.name];
        const wanted = typeof entry === "string" ? entry : (entry?.model ?? model.name);
        const c2d = byName.get(norm(wanted));
        if (!c2d) {
          const first = norm(model.name).slice(0, 2);
          unmatched.push({ model: model.name, candidates: c2dModels.map((m) => m.name).filter((n) => norm(n).startsWith(first)).slice(0, 8) });
          continue;
        }
        const series = typeof entry === "object" && entry.series ? new RegExp(entry.series, "i") : undefined;
        claims.set(c2d.id, [...(claims.get(c2d.id) ?? []), { model, series }]);
      }
      for (const [c2dId, owners] of claims) {
        const c2d = c2dModels.find((m) => m.id === c2dId)!;
        const series = await all(`/series?modelId=${c2dId}`);
        // Some keys cap list results (100 items): fetch a capped model's trims per series.
        let trims = await all(`/trims?modelId=${c2dId}`);
        if (trims.length > 0 && trims.length % 100 === 0) {
          const perSeries: any[] = [];
          for (const s of series) perSeries.push(...(await all(`/trims?seriesId=${s.id}`)));
          trims = perSeries;
        }
        const seriesName = new Map(series.map((s: any) => [s.id, String(s.name)]));
        const generations = await all(`/generations?modelId=${c2dId}`);
        const filters = owners.map((o) => o.series).filter((f): f is RegExp => !!f);
        for (const owner of owners) {
          const keep = (t: any) => {
            const name = seriesName.get(t.seriesId) ?? "";
            return owner.series ? owner.series.test(name) : !filters.some((f) => f.test(name));
          };
          data.push({
            model: { name: owner.model.name, category: owner.model.category },
            car2dbModel: { id: c2d.id, name: c2d.name },
            generations,
            series,
            trims: trims.filter(keep),
          });
        }
      }
      const { file, issues } = car2dbToCatalog({ make: make.name, models: data, retrievedAt: new Date().toISOString().slice(0, 10) });
      const problems = validateCatalog(file);
      const outFile = path.join(out, fileName);
      if (file.makes[0]!.models.length) fs.writeFileSync(outFile, JSON.stringify(file, null, 2) + "\n");
      const counts = file.makes[0]!.models.reduce(
        (c, m) => ({ generations: c.generations + m.generations.length, vehicles: c.vehicles + m.generations.reduce((n, g) => n + g.vehicles.length, 0) }),
        { generations: 0, vehicles: 0 },
      );
      report.makes[make.name] = { models: data.length, ...counts, unmatched, issues: issues.slice(0, 200), problems };
      console.log(`[car2db] ${make.name}: ${data.length}/${make.models.length} models, ${counts.generations} generations, ${counts.vehicles} configurations; ${unmatched.length} unmatched, ${issues.length} skipped trims, ${problems.length} problems`);
    }
  }
  report.requests = requests;
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`[car2db] ${requests} API requests (rest from cache); report: ${path.join(out, "report.json")}`);
}

if (require.main === module) {
  fetchCar2dbCatalog().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

// `medusa exec` needs a default export; this script runs with plain node.
export default async function () {
  await fetchCar2dbCatalog();
}
