import { CatalogFileSchema, SourceTier, type CatalogFile } from "../../contract";
import {
  displacementToCc,
  higherTier,
  mayOverwrite,
  mergeSources,
  planCatalog,
  powerToKw,
  verifyDue,
  type CatalogSnapshot,
} from "../../core";

const now = new Date("2026-10-07T12:00:00Z");

describe("trust tiers", () => {
  it("overwrites only from a higher tier, never a staff edit", () => {
    expect(mayOverwrite(SourceTier.DRAFT, SourceTier.RESEARCH)).toBe(true);
    expect(mayOverwrite(SourceTier.RESEARCH, SourceTier.RESEARCH)).toBe(false);
    expect(mayOverwrite(SourceTier.LICENSED, SourceTier.REFERENCE)).toBe(false);
    expect(mayOverwrite(SourceTier.HUMAN, SourceTier.LICENSED)).toBe(false);
    expect(mayOverwrite(null, SourceTier.RESEARCH)).toBe(true); // unknown counts as draft
    expect(higherTier(SourceTier.HUMAN, SourceTier.LICENSED)).toBe(SourceTier.HUMAN);
    expect(higherTier(SourceTier.DRAFT, SourceTier.REFERENCE)).toBe(SourceTier.REFERENCE);
  });

  it("keeps the newest sources first, one per source, at most five", () => {
    const at = "2026-10-01";
    const s = (name: string, url: string | null = null) => ({ name, url, tier: SourceTier.RESEARCH, at });
    const merged = mergeSources([s("a"), s("b"), s("c"), s("d"), s("e")], s("b"));
    expect(merged.map((x) => x.name)).toEqual(["b", "a", "c", "d", "e"]);
    expect(mergeSources(merged, s("f")).map((x) => x.name)).toEqual(["f", "b", "a", "c", "d"]);
    expect(mergeSources(null, s("w", "https://x")).map((x) => x.url)).toEqual(["https://x"]);
  });

  it("schedules verification by tier", () => {
    expect(verifyDue(SourceTier.DRAFT, null, now)).toEqual(now);
    expect(verifyDue(SourceTier.REFERENCE, "2026-01-01T00:00:00Z", now)!.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(verifyDue(SourceTier.HUMAN, null, now)).toBeNull();
  });
});

describe("units as written", () => {
  it("converts power to kW from metric or mechanical horsepower", () => {
    expect(powerToKw(85, "ch")).toBe(63);
    expect(powerToKw(150, "PS")).toBe(110);
    expect(powerToKw(150, "hp")).toBe(112);
    expect(powerToKw(63, "kW")).toBe(63);
    expect(powerToKw(85, "?")).toBeNull();
    expect(powerToKw(null, "ch")).toBeNull();
  });

  it("keeps a displacement only when exact", () => {
    expect(displacementToCc(1461, "cm³")).toBe(1461);
    expect(displacementToCc(1598, "cc")).toBe(1598);
    expect(displacementToCc(1.461, "L")).toBe(1461);
    expect(displacementToCc(1.5, "L")).toBeNull();
    expect(displacementToCc(2, "l")).toBeNull();
  });
});

describe("merge import and provenance", () => {
  const engine = { fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 63, code: "K9K" };
  const draft = { source_tier: SourceTier.DRAFT, sources: [{ name: "Wikipedia draft", url: "https://w/Clio", tier: SourceTier.DRAFT, at: "2026-10-07" }] };
  // Catalog: Clio V (draft) 2019– without code; one configuration.
  const snapshot = (genTier: SourceTier = SourceTier.DRAFT): CatalogSnapshot => ({
    makes: [{ id: "mk", name: "Renault", ...draft }],
    models: [{ id: "md", make_id: "mk", name: "Clio", category: "CAR", ...draft }],
    generations: [{ id: "g", model_id: "md", name: "V", code: "BF", year_start: 2019, year_end: 2025, ...draft, source_tier: genTier }],
    engines: [{ id: "e", ...engine, ...draft }],
    vehicles: [
      { id: "v", generation_id: "g", engine_id: "e", body_style: "HATCHBACK", drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2019, year_end: null, doors: 5, ...draft },
    ],
    references: [],
  });
  const research = (tier?: SourceTier): CatalogFile =>
    CatalogFileSchema.parse({
      format: "vehicle-catalog@1",
      source: { name: "AI research", retrieved_at: "2026-10-07", ...(tier ? { tier } : {}) },
      makes: [
        {
          name: "Renault",
          models: [
            {
              name: "Clio",
              generations: [
                {
                  name: "V",
                  code: "BJA", // contradicts the draft's BF
                  year_start: 2019,
                  year_end: 2025,
                  source: "https://en.wikipedia.org/wiki/Renault_Clio",
                  vehicles: [{ engine, body_style: "HATCHBACK", doors: 5, year_start: 2019, year_end: 2025 }],
                },
              ],
            },
          ],
        },
      ],
    });

  it("lets research replace draft values, and stamps what it confirmed", () => {
    const plan = planCatalog(research(), snapshot(), { mode: "merge", now });
    const gen = plan.updates.find((u) => u.id === "g")!;
    expect(gen.data).toEqual({ code: "BJA" });
    expect(gen.provenance!.source_tier).toBe(SourceTier.RESEARCH);
    expect(gen.provenance!.sources[0]).toEqual({
      name: "AI research",
      url: "https://en.wikipedia.org/wiki/Renault_Clio",
      tier: SourceTier.RESEARCH,
      at: "2026-10-07",
    });
    // The configuration's end year was blank: filled; make, model and engine are confirmed.
    expect(plan.updates.find((u) => u.id === "v")!.data).toEqual({ year_end: 2025 });
    expect(plan.touches.map((t) => [t.entity, t.id, t.provenance.source_tier])).toEqual([
      ["VehicleMake", "mk", SourceTier.RESEARCH],
      ["VehicleModel", "md", SourceTier.RESEARCH],
      ["VehicleEngine", "e", SourceTier.RESEARCH],
    ]);
    expect(plan.touches[0]!.provenance.verified_at).toEqual(now);
    expect(plan.touches[0]!.provenance.sources.map((s) => s.name)).toEqual(["AI research", "Wikipedia draft"]);
  });

  it("keeps values of an equal or higher tier and staff edits, and does not confirm them", () => {
    for (const tier of [SourceTier.RESEARCH, SourceTier.LICENSED, SourceTier.HUMAN]) {
      const plan = planCatalog(research(), snapshot(tier), { mode: "merge", now });
      expect(plan.updates.find((u) => u.id === "g")).toBeUndefined();
      expect(plan.differences).toEqual(["Renault › Clio › V: code is BF, catalog says BJA."]);
      expect(plan.touches.map((t) => t.id)).not.toContain("g");
    }
  });

  it("gives created records the file's tier and its most specific source", () => {
    const plan = planCatalog(research(SourceTier.LICENSED), { ...snapshot(), generations: [], vehicles: [] }, { mode: "merge", now });
    expect(plan.generations[0]!.provenance).toEqual({
      source_tier: SourceTier.LICENSED,
      sources: [{ name: "AI research", url: "https://en.wikipedia.org/wiki/Renault_Clio", tier: SourceTier.LICENSED, at: "2026-10-07" }],
      verified_at: now,
    });
    expect(plan.vehicles[0]!.provenance.source_tier).toBe(SourceTier.LICENSED);
  });

  it("files without a tier count as research", () => {
    expect(research().source.tier).toBe(SourceTier.RESEARCH);
  });
});
