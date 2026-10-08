import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import { FITMENT_MODULE } from "@repo/module-fitment";
import { GARAGE_MODULE } from "@repo/module-garage";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { webResearch } from "../../src/queries/web-research";
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
        { name: "Sandero", generations: [{ name: "III", year_start: 2020, source: "https://en.wikipedia.org/wiki/Dacia_Sandero" }] },
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
  testSuite: ({ api, getContainer }) => {
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

    it("keeps the lease after a first attempt that didn't apply, for the fallback to submit", async () => {
      await service().refreshTasks();
      const task = await claim("RESEARCH_CONFIGURATIONS");
      const local = await service().submitTaskResult(task.id, { lease_token: task.lease_token, model: "qwen3.5:4b", output: "nope", final: false });
      expect(local).toMatchObject({ status: "FAILED", reason: "invalid output", final: false });
      expect(await service().retrieveCatalogTask(task.id)).toMatchObject({ status: "RUNNING", lease_token: task.lease_token, report: { attempts: [{ reason: "invalid output" }] } });
      // The agent's answer settles it.
      const agent = await service().submitTaskResult(task.id, {
        lease_token: task.lease_token,
        model: "openrouter:google/gemini-3.6-flash",
        file: CatalogFileSchema.parse({
          format: "vehicle-catalog@1",
          source: { name: "agent" },
          makes: [{ name: "Dacia", models: [{ name: "Sandero", generations: [{ name: "III", year_start: 2020, vehicles: [{ engine: { fuel: "GASOLINE", power_kw: 67, cylinders: 3 }, body_style: "HATCHBACK", doors: 5, year_start: 2020 }] }] }] }],
        }),
        sources: [url],
      });
      expect(agent).toMatchObject({ status: "APPLIED" });
      expect(await service().retrieveCatalogTask(task.id)).toMatchObject({ status: "APPLIED", lease_token: null });
    });

    it("sends a first attempt's proposal to review when the fallback finds nothing better", async () => {
      await service().refreshTasks();
      const task = await claim("RESEARCH_CONFIGURATIONS");
      const local = await service().submitTaskResult(task.id, {
        lease_token: task.lease_token,
        model: "nvidia:nemotron",
        evidence: [{ url, text: page }],
        output: {
          generation: { code: null, from: null, to: null, quote: null },
          configurations: [{ ...version, fuel: "GASOLINE", power: 90, power_unit: "ch", from: 2020, to: null, assumed: true, quote: "1.0 TCe 90 | 90 ch (67 kW) | 2020–" }],
          notes: "",
        },
        final: false,
      });
      expect(local).toMatchObject({ status: "REVIEW", reason: "mostly assumed values", final: false });
      const agent = await service().submitTaskResult(task.id, { lease_token: task.lease_token, model: "nvidia:agent", error: "tool input did not match" });
      expect(agent).toMatchObject({ status: "REVIEW", reason: "mostly assumed values" });
      const stored = await service().retrieveCatalogTask(task.id);
      expect(stored).toMatchObject({ status: "REVIEW", lease_token: null, report: { assumed: 1, fallback: { status: "FAILED", reason: "error" } } });
      expect(stored.proposal).toMatchObject({ makes: [{ name: "Dacia" }] });
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
      expect(engine).toMatchObject({ power_kw: 74, power_hp: 99, source_tier: "REFERENCE" }); // hp follows kW
      expect((await service().retrieveCatalogTask(task.id)).status).toBe("DONE");
    });

    it("never moves a generation's years past its configurations on a model verification", async () => {
      await service().refreshTasks();
      const task = (await service().claimTasks({ kinds: ["VERIFY_MODEL" as any], make: "Dacia", limit: 5 })).find((t: any) => t.model === "Logan")!;
      const result = await service().submitTaskResult(task.id, {
        lease_token: task.lease_token,
        evidence: [{ url: "https://x", text: "The third generation Logan was produced from 2022." }],
        output: { generations: [{ ref: "g1", found: true, code: null, from: 2022, to: null, quote: "third generation Logan was produced from 2022" }], missing: [], notes: "" },
      });
      // The draft generation starts in 2020 and has a 2021 configuration: 2022 would strand it.
      expect(result).toMatchObject({ status: "REVIEW", report: { review: ['g1: year_start 2020 → 2022 ("third generation Logan was produced from 2022")'] } });
      expect((await service().listVehicleGenerations({ name: "III", model: { name: "Logan" } } as any))[0]!.year_start).toBe(2020);
    });

    it("keeps a rejection closed through the ledger refresh, and approvals never overwrite staff edits", async () => {
      await service().refreshTasks();
      const [task] = await service().listCatalogTasks({ key: "dacia/sandero/iii" });
      await service().rejectTask(task!.id, "Wait for the facelift data.");
      await service().refreshTasks();
      expect(await service().retrieveCatalogTask(task!.id)).toMatchObject({ status: "DONE", feedback: "Wait for the facelift data." });

      // A staff edit, then a reviewed proposal that contradicts it.
      const sandero = (await service().listVehicleGenerations({ name: "III", model: { name: "Sandero" } } as any))[0]!;
      await service().updateVehicleGenerations([{ id: sandero.id, code: "STAFF" }] as any);
      await service().pinHuman("VehicleGeneration", [sandero.id]);
      const proposal = CatalogFileSchema.parse({
        format: "vehicle-catalog@1",
        source: { name: "agent" },
        makes: [{ name: "Dacia", models: [{ name: "Sandero", generations: [{ name: "III", code: "AI", year_start: 2020, vehicles: [{ engine: { fuel: "GASOLINE", power_kw: 67, cylinders: 3 }, body_style: "HATCHBACK", doors: 5, year_start: 2020 }] }] }] }],
      });
      await service().updateCatalogTasks([{ id: task!.id, status: "REVIEW", proposal }] as any);
      await service().approveTask(task!.id);
      const after = (await service().listVehicleGenerations({ id: sandero.id }))[0]!;
      expect(after).toMatchObject({ code: "STAFF", source_tier: "HUMAN" });
      expect(await service().listVehicles({ generation_id: sandero.id })).toHaveLength(1);
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
  
    describe("over HTTP, as the n8n workflow drives it", () => {
      const steward = "/admin/vehicle-catalog";
      async function auth() {
        const admin = await adminHeaders(getContainer());
        const { data } = await api.post("/admin/api-keys", { title: "steward", type: "secret" }, admin);
        return { headers: { authorization: `Basic ${Buffer.from(`${data.api_key.token}:`).toString("base64")}` } };
      }

      it("refreshes, claims, prompts with the cached evidence, and applies a checked answer", async () => {
        const headers = await auth();
        // The pages the gateway would read (no network in tests).
        const gateway = webResearch(getContainer(), { tavilyKey: null });
        await gateway.remember(url, page);
        await gateway.remember("https://en.wikipedia.org/wiki/Dacia_Logan", "Dacia Logan, a sedan.");

        expect((await api.post(`${steward}/lint`, {}, headers)).data).toMatchObject({ findings: expect.any(Number) });
        expect((await api.post(`${steward}/tasks/refresh`, {}, headers)).data.created).toBeGreaterThan(0);
        const [task] = (await api.post(`${steward}/tasks/claim`, { limit: 1, kinds: ["RESEARCH_CONFIGURATIONS"] }, headers)).data.tasks;
        expect(task).toMatchObject({ kind: "RESEARCH_CONFIGURATIONS", key: "dacia/sandero/iii", lease_token: expect.any(String) });

        const prompt = (await api.post(`${steward}/tasks/${task.id}/prompt`, { lease_token: task.lease_token }, headers)).data;
        expect(prompt.urls[0]).toBe(url);
        expect(prompt.messages[1].content).toContain("1.0 TCe 90");
        expect(prompt.schema).toMatchObject({ type: "object" });

        const result = (
          await api.post(
            `${steward}/tasks/${task.id}/result`,
            {
              lease_token: task.lease_token,
              model: "qwen3.5:4b",
              output: {
                generation: { code: null, from: null, to: null, quote: null },
                configurations: [{ ...version, fuel: "GASOLINE", power: 90, power_unit: "ch", from: 2020, to: null, quote: "1.0 TCe 90 | 90 ch (67 kW)" }],
                notes: "",
              },
            },
            headers,
          )
        ).data;
        expect(result).toMatchObject({ status: "APPLIED", report: { created: { vehicles: 1 } } });
        // The lease is spent: the same token can't submit twice.
        const again = await api.post(`${steward}/tasks/${task.id}/result`, { lease_token: task.lease_token, error: "x" }, headers).catch((e: any) => e.response);
        expect(again.status).toBe(400);
      });

      it("merges a near-duplicate configuration on approval, re-pointing fitments, garage entries and references", async () => {
        const headers = await auth();
        const logan = (await service().listVehicleGenerations({ name: "III", model: { name: "Logan" } } as any))[0]!;
        const keep = (await service().listVehicles({ generation_id: logan.id }))[0]!;
        // The same 70 kW diesel sedan, its engine described without the code.
        const [engine] = (await service().createVehicleEngines([{ fuel: "DIESEL", layout: "INLINE", cylinders: 4, displacement_cc: 1461, power_kw: 70, code: null, power_hp: 94 }] as any)) as unknown as any[];
        const [dup] = (await service().createVehicles([{ generation_id: logan.id, engine_id: engine!.id, body_style: "SEDAN", doors: 4, drive: "FWD", transmission: "MANUAL", trim: null, year_start: 2022, year_end: null }] as any)) as unknown as any[];
        await service().createVehicleReferences([{ vehicle_id: dup!.id, source: "OTHER", external_id: "dup-1" }] as any);
        await getContainer().resolve<any>(FITMENT_MODULE).createFitments([{ variant_id: "variant_1", vehicle_id: dup!.id, quantity: 1 }]);
        await getContainer().resolve<any>(GARAGE_MODULE).createCustomerVehicles([{ customer_id: "cus_1", vehicle_id: dup!.id, nickname: null, vin: null, registration: null }]);

        await api.post(`${steward}/lint`, {}, headers);
        const [finding] = await service().listCatalogTasks({ kind: "CLEANUP" as any, rule: "vehicle.near_duplicate" });
        expect(finding).toMatchObject({ status: "REVIEW", record_id: dup!.id, finding: { fix: { kind: "merge", into: keep.id } } });

        await api.post(`${steward}/tasks/${finding!.id}/approve`, {}, headers);
        expect(await service().listVehicles({ id: dup!.id })).toEqual([]);
        expect(await getContainer().resolve<any>(FITMENT_MODULE).listFitments({ vehicle_id: keep.id })).toHaveLength(1);
        expect(await getContainer().resolve<any>(GARAGE_MODULE).listCustomerVehicles({ vehicle_id: keep.id })).toHaveLength(1);
        expect((await service().listVehicleReferences({ external_id: "dup-1" }))[0]!.vehicle_id).toBe(keep.id);
        expect((await service().retrieveCatalogTask(finding!.id)).status).toBe("DONE");
      });

      it("rejects with feedback, and serves the research gateway to the fallback agent", async () => {
        const headers = await auth();
        await service().refreshTasks();
        const [task] = (await api.post(`${steward}/tasks/claim`, { limit: 1, kinds: ["RESEARCH_CONFIGURATIONS"] }, headers)).data.tasks;
        await webResearch(getContainer(), { tavilyKey: null }).remember(url, page);
        const read = (await api.post(`${steward}/research/read`, { url, focus: "TCe 90", task_id: task.id }, headers)).data;
        expect(read).toMatchObject({ via: "cache", text: expect.stringContaining("1.0 TCe 90") });
        expect((await service().retrieveCatalogTask(task.id)).sources).toContain(url);
        // No Tavily key in tests: web search says so instead of failing.
        expect((await api.post(`${steward}/research/search`, { query: "Dacia Sandero III moteurs" }, headers)).data).toMatchObject({ results: [], note: expect.any(String) });

        await service().submitTaskResult(task.id, { lease_token: task.lease_token, output: { generation: { code: null, from: null, to: null, quote: null }, configurations: [], notes: "" } });
        const lint = await service().runLint();
        expect(lint).toMatchObject({ findings: expect.any(Number) });
      });
    });
  },
});
