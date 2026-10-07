import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { CatalogFileSchema } from "@repo/module-vehicle/contract";

jest.setTimeout(120 * 1000);

// The catalog as a bulk draft would leave it: Logan III with one diesel, Sandero without configurations.
const draft = CatalogFileSchema.parse({
  format: "vehicle-catalog@1",
  source: { name: "Wikipedia draft", tier: "DRAFT", url: "https://en.wikipedia.org/wiki/Dacia_Logan" },
  makes: [
    {
      name: "Dacia",
      models: [
        {
          name: "Logan",
          generations: [
            {
              name: "III",
              year_start: 2020,
              vehicles: [
                {
                  engine: { fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 70, code: "K9K" },
                  body_style: "SEDAN",
                  year_start: 2021,
                },
              ],
            },
          ],
        },
        { name: "Sandero", generations: [{ name: "III", year_start: 2020 }] },
      ],
    },
  ],
});

const page = [
  "Dacia Sandero III is a supermini produced from 2020.",
  "| Engine | Power | Years |",
  "| 1.0 SCe 65 | 65 ch | 2020–2022 |",
  "| 1.0 TCe 90 | 90 ch (67 kW) | 2020– |",
].join("\n");
const url = "https://en.wikipedia.org/wiki/Dacia_Sandero";
const version = { engine_code: null, layout: null, cylinders: 3, displacement: null, displacement_unit: null, body: "HATCHBACK", doors: 5, drive: "FWD", gearbox: "MANUAL", trim: null, assumed: false };

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    const service = () => getContainer().resolve<VehicleModuleService>(VEHICLE_MODULE);
    const claim = async (kind: string) => (await service().claimTasks({ kinds: [kind as any], limit: 5 }))[0]!;

    beforeEach(async () => {
      await service().importCatalog(draft);
    });

    it("queues the catalog's needs and leases each task to one worker", async () => {
      const refreshed = await service().refreshTasks();
      expect(refreshed.created).toBeGreaterThanOrEqual(2);
      const tasks = await service().listCatalogTasks({});
      expect(tasks.map((t) => `${t.kind} ${t.key}`).sort()).toEqual(
        expect.arrayContaining(["RESEARCH_CONFIGURATIONS dacia/sandero/iii", "VERIFY_GENERATION dacia/logan/iii", "VERIFY_MODEL dacia/logan"]),
      );

      const first = await service().claimTasks({ limit: 50 });
      expect(first.every((t) => t.status === "RUNNING" && t.lease_token)).toBe(true);
      expect(await service().claimTasks({ limit: 50 })).toEqual([]); // all leased
      const later = await service().claimTasks({ limit: 50, now: new Date(Date.now() + 2 * 3600_000) });
      expect(later.length).toBe(first.length); // leases expired: taken over

      await expect(service().submitTaskResult(first[0]!.id, { lease_token: "stale", error: "x" })).rejects.toThrow(/lease/);
    });

    it("applies a local research answer whose quotes check out, drops invented versions", async () => {
      await service().refreshTasks();
      const task = await claim("RESEARCH_CONFIGURATIONS");
      expect(task.key).toBe("dacia/sandero/iii");
      const result = await service().submitTaskResult(task.id, {
        lease_token: task.lease_token,
        model: "qwen3.5:4b",
        evidence: [{ url, text: page }],
        cost: { usd: 0, steps: 1 },
        output: {
          generation: { code: null, from: null, to: null, quote: null },
          configurations: [
            { ...version, fuel: "GASOLINE", power: 65, power_unit: "ch", from: 2020, to: 2022, quote: "1.0 SCe 65 | 65 ch | 2020–2022" },
            { ...version, fuel: "GASOLINE", power: 90, power_unit: "ch", from: 2020, to: null, quote: "1.0 TCe 90 | 90 ch (67 kW) | 2020–" },
            { ...version, fuel: "LPG", power: 100, power_unit: "ch", from: 2020, to: null, quote: "1.0 ECO-G 100 ch" }, // not in the page
          ],
          notes: "",
        },
      });
      expect(result).toMatchObject({ status: "APPLIED", reason: "applied", report: { unsupported: ["version 100 ch 2020"], created: { vehicles: 2 } } });

      const [sandero] = await service().listVehicleGenerations({ name: "III", model: { name: "Sandero" } } as any);
      const vehicles = await service().listVehicles({ generation_id: sandero!.id }, { relations: ["engine"] });
      expect(vehicles.map((v: any) => [v.engine.power_kw, v.year_start, v.year_end, v.source_tier]).sort()).toEqual([
        [48, 2020, 2022, "RESEARCH"],
        [66, 2020, null, "RESEARCH"],
      ]);
      expect(vehicles[0]!.sources[0]).toMatchObject({ name: "AI research (qwen3.5:4b)", url, tier: "RESEARCH" });

      const done = await service().retrieveCatalogTask(task.id);
      expect(done).toMatchObject({ status: "APPLIED", lease_token: null, sources: [url], cost: { steps: 1, model: "qwen3.5:4b" } });
      expect(new Date(done.next_run_at!).getTime()).toBeGreaterThan(Date.now() + 29 * 86_400_000);
    });

    it("backs off after an invalid answer", async () => {
      await service().refreshTasks();
      const task = await claim("RESEARCH_CONFIGURATIONS");
      const result = await service().submitTaskResult(task.id, { lease_token: task.lease_token, output: "{ not json" });
      expect(result.status).toBe("FAILED");
      expect(await service().claimTasks({ kinds: ["RESEARCH_CONFIGURATIONS" as any] })).toEqual([]);
    });

    it("verifies a generation: corrects a draft, leaves an engine mismatch to a person, who approves it", async () => {
      await service().refreshTasks();
      const task = await claim("VERIFY_GENERATION");
      const logan = "| 1.5 dCi 95 | 95 ch | 2021–2023 |";
      const result = await service().submitTaskResult(task.id, {
        lease_token: task.lease_token,
        model: "qwen3.5:4b",
        evidence: [{ url: "https://en.wikipedia.org/wiki/Dacia_Logan", text: logan }],
        output: {
          configurations: [{ ref: "c1", found: true, from: 2021, to: 2023, quote: "1.5 dCi 95 | 95 ch | 2021–2023" }],
          engines: [{ ref: "e1", found: true, power: 95, power_unit: "ch", displacement: null, displacement_unit: null, quote: "1.5 dCi 95 | 95 ch" }],
          missing: [],
          notes: "",
        },
      });
      // 95 ch is 70 kW: the engine is confirmed. The draft configuration's end year is filled.
      expect(result.status).toBe("APPLIED");
      const [config] = await service().listVehicles({ year_start: 2021 }, { relations: ["engine"] });
      expect(config).toMatchObject({ year_end: 2023, source_tier: "RESEARCH", engine: { source_tier: "RESEARCH" } });

      // Next time round, the source says 100 ch (74 kW): engines are shared, a person decides.
      const again = (await service().claimTasks({ kinds: ["VERIFY_GENERATION" as any], now: new Date(Date.now() + 40 * 86_400_000) }))[0];
      expect(again).toBeUndefined(); // research tier: verified again after 90 days, not before
    });

    it("keeps an engine contradiction for review, then applies it on approval", async () => {
      await service().refreshTasks();
      const task = await claim("VERIFY_GENERATION");
      const result = await service().submitTaskResult(task.id, {
        lease_token: task.lease_token,
        evidence: [{ url: "https://x", text: "| 1.5 dCi 100 | 100 ch | 2021– |" }],
        output: {
          configurations: [],
          engines: [{ ref: "e1", found: true, power: 100, power_unit: "ch", displacement: null, displacement_unit: null, quote: "1.5 dCi 100 | 100 ch" }],
          missing: [],
          notes: "",
        },
      });
      expect(result).toMatchObject({ status: "REVIEW", reason: "corrections to review", report: { review: ['e1: power_kw 70 → 74 ("1.5 dCi 100 | 100 ch")'] } });
      await service().approveTask(task.id);
      const [engine] = await service().listVehicleEngines({ code: "K9K" });
      expect(engine).toMatchObject({ power_kw: 74, power_hp: expect.any(Number), source_tier: "REFERENCE" });
      expect((await service().retrieveCatalogTask(task.id)).status).toBe("DONE");
    });

    it("turns rule findings into reviews, merges duplicates on approval, and remembers dismissals", async () => {
      // The same 70 kW diesel without its code: a duplicate engine.
      const twin = await service().createVehicleEngines([{ fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 70, code: null, power_hp: 94 }] as any);
      const lint = await service().runLint();
      expect(lint.rules["engine.duplicate"]).toBe(1);
      const [finding] = await service().listCatalogTasks({ kind: "CLEANUP" as any, rule: "engine.duplicate" });
      expect(finding).toMatchObject({ status: "REVIEW", record_id: twin[0]!.id, finding: { fix: { kind: "merge" } } });

      await service().approveTask(finding!.id);
      expect(await service().listVehicleEngines({ id: twin[0]!.id })).toEqual([]);
      expect((await service().runLint()).rules["engine.duplicate"]).toBeUndefined();

      // A dismissed finding stays quiet.
      const dup = await service().createVehicleEngines([{ fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 70, code: null, power_hp: 94 }] as any);
      await service().runLint();
      const [again] = await service().listCatalogTasks({ kind: "CLEANUP" as any, record_id: dup[0]!.id });
      await service().rejectTask(again!.id, "Two different engines: the K9K and an older F9Q.");
      await service().runLint();
      expect(await service().retrieveCatalogTask(again!.id)).toMatchObject({ status: "DONE", feedback: expect.stringContaining("F9Q") });
    });
  },
});
