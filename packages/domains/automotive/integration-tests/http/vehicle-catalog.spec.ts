import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { CatalogFileSchema } from "@repo/module-vehicle/contract";

jest.setTimeout(60 * 1000);

const catalog = CatalogFileSchema.parse({
  format: "vehicle-catalog@1",
  market: "TN",
  source: { name: "Test fixture" },
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
                  engine: { fuel: "GASOLINE", layout: "INLINE", cylinders: 3, displacement_cc: 999, power_kw: 67, code: "H4D" },
                  body_style: "SEDAN",
                  year_start: 2021,
                  references: [{ source: "OTHER", external_id: "fixture-1" }],
                },
              ],
            },
          ],
        },
        { name: "Dokker", category: "LCV" },
      ],
    },
  ],
});

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    const service = () => getContainer().resolve<VehicleModuleService>(VEHICLE_MODULE);

    it("imports a catalog once: a second run finds everything", async () => {
      const first = await service().importCatalog(catalog);
      expect(first).toMatchObject({
        problems: [],
        created: { makes: 1, models: 2, generations: 1, engines: 1, vehicles: 1, references: 1 },
      });
      const [engine] = await service().listVehicleEngines({ code: "H4D" });
      expect(engine).toMatchObject({ power_kw: 67, power_hp: 90 }); // derived like an API write
      const [make] = await service().listVehicleMakes({ name: "Dacia" });
      expect(make!.slug).toBe("dacia");

      const second = await service().importCatalog(catalog);
      expect(second.created).toEqual({ makes: 0, models: 0, generations: 0, engines: 0, vehicles: 0, references: 0 });
      expect(second.existing).toEqual({ makes: 1, models: 2, generations: 1, engines: 1, vehicles: 1, references: 1 });
    });

    it("writes nothing in a dry run or when the file has problems", async () => {
      const dry = await service().importCatalog(catalog, { dryRun: true });
      expect(dry.created.makes).toBe(1);
      expect(await service().listVehicleMakes({ name: "Dacia" })).toEqual([]);

      const bad = structuredClone(catalog);
      bad.makes[0]!.models[0]!.generations[0]!.vehicles[0]!.year_start = 2018; // before its generation
      const refused = await service().importCatalog(bad);
      expect(refused.problems).toEqual(["Dacia › Logan › III › #1: starts (2018) before its generation (2020)."]);
      expect(await service().listVehicleMakes({ name: "Dacia" })).toEqual([]);
    });
  
    describe("provenance and trust", () => {
      const withSource = (name: string, tier: string, code: string | null) => {
        const file = structuredClone(catalog);
        file.source = { name, tier } as any;
        file.makes[0]!.models[0]!.generations[0]!.code = code;
        return file;
      };
      const logan3 = async () => (await service().listVehicleGenerations({ name: "III" }))[0]!;

      it("stamps imports, lets research replace draft values, and never overwrites a staff edit", async () => {
        await service().importCatalog(withSource("Wikipedia draft", "DRAFT", "X1"));
        let gen = await logan3();
        expect(gen).toMatchObject({ code: "X1", source_tier: "DRAFT", sources: [{ name: "Wikipedia draft", tier: "DRAFT" }] });
        expect(gen.verified_at).toBeTruthy();

        // Research outranks the draft: merge replaces its code.
        const merged = await service().importCatalog(withSource("AI research", "RESEARCH", "LJI"), { mode: "merge" });
        expect(merged.updated).toEqual(["Dacia › Logan › III: code X1 → LJI."]);
        gen = await logan3();
        expect(gen).toMatchObject({ code: "LJI", source_tier: "RESEARCH" });
        expect(gen.sources.map((s: any) => s.name)).toEqual(["AI research", "Wikipedia draft"]);

        // A staff edit in the admin pins the record.
        const admin = await adminHeaders(getContainer());
        await api.put(`/admin/vehicles/vehicle_generation/${gen.id}`, { code: "LJI-2" }, admin);
        gen = await logan3();
        expect(gen).toMatchObject({ code: "LJI-2", source_tier: "HUMAN" });
        expect(gen.sources[0]).toMatchObject({ name: "admin", tier: "HUMAN" });

        // Not even a licensed catalog overwrites it, nor confirms the contradicted record.
        const licensed = await service().importCatalog(withSource("car2db", "LICENSED", "ZZZ"), { mode: "merge" });
        expect(licensed.differences).toEqual(["Dacia › Logan › III: code is LJI-2, catalog says ZZZ."]);
        expect((await logan3()).code).toBe("LJI-2");
        // The rest of the file confirms what it agrees with: the configuration is now licensed.
        const [config] = await service().listVehicles({ generation_id: gen.id });
        expect(config).toMatchObject({ source_tier: "LICENSED" });
      });
    });

    describe("research API (/admin/vehicle-catalog)", () => {
      /** A secret API key, as an automation (n8n) authenticates. */
      async function apiKeyHeaders() {
        const admin = await adminHeaders(getContainer());
        const { data } = await api.post("/admin/api-keys", { title: "catalog research", type: "secret" }, admin);
        return { headers: { authorization: `Basic ${Buffer.from(`${data.api_key.token}:`).toString("base64")}` } };
      }

      it("lists the least complete models, exports what exists, validates then applies a file", async () => {
        const auth = await apiKeyHeaders();
        await service().importCatalog(catalog);

        const coverage = (await api.get("/admin/vehicle-catalog/coverage?make=dacia&max_configurations=", auth)).data;
        expect(coverage.models.map((m: any) => [m.model, m.generations, m.configurations])).toEqual([
          ["Dokker", 0, 0],
          ["Logan", 1, 1],
        ]);
        expect(coverage.summary).toEqual({ models: 2, without_generations: 1, without_configurations: 1 });

        const exported = (await api.get("/admin/vehicle-catalog/export?make=Dacia&model=logan", auth)).data;
        expect(exported.makes[0].models.map((m: any) => m.name)).toEqual(["Logan"]);
        expect(exported.makes[0].models[0].generations[0].vehicles[0]).toMatchObject({
          engine: { code: "H4D", power_kw: 67 },
          references: [{ source: "OTHER", external_id: "fixture-1" }],
        });

        // Research found: the generation's code and end, and a facelift engine.
        const research = structuredClone(exported);
        const gen = research.makes[0].models[0].generations[0];
        Object.assign(gen, { code: "LJI", year_end: 2025 });
        gen.vehicles[0].year_end = 2025;
        gen.vehicles.push({ ...gen.vehicles[0], engine: { ...gen.vehicles[0].engine, power_kw: 74 }, year_start: 2022, references: [] });
        research.source = { name: "Research agent", url: "https://example.com/logan" };

        const dry = (await api.post("/admin/vehicle-catalog/import?dry_run=true&mode=fill", research, auth)).data.report;
        expect(dry).toMatchObject({
          dryRun: true,
          mode: "fill",
          problems: [],
          created: { vehicles: 1, engines: 1 },
          updated: [
            "Dacia › Logan › III: code empty → LJI.",
            "Dacia › Logan › III: year_end empty → 2025.",
            "Dacia › Logan › III › #1: year_end empty → 2025.",
          ],
          differences: [],
          warnings: [],
        });
        const [before] = await service().listVehicleGenerations({ name: "III" });
        expect(before!.code).toBeNull();

        const applied = (await api.post("/admin/vehicle-catalog/import?mode=fill", research, auth)).data.report;
        expect(applied).toMatchObject({ dryRun: false, problems: [], created: { vehicles: 1 } });
        const [after] = await service().listVehicleGenerations({ name: "III" });
        expect(after).toMatchObject({ code: "LJI", year_end: 2025 });
        expect(await service().listVehicles({ generation_id: after!.id })).toHaveLength(2);
      });

      it("queues focused research tasks, each configuration task with what exists", async () => {
        const auth = await apiKeyHeaders();
        await service().importCatalog(catalog);
        const { data } = await api.get("/admin/vehicle-catalog/tasks?make=Dacia&max_configurations=1", auth);
        expect(data.count).toBe(2);
        expect(data.tasks[0]).toEqual({ kind: "generations", make: "Dacia", model: "Dokker", category: "LCV" });
        expect(data.tasks[1]).toMatchObject({
          kind: "configurations",
          model: "Logan",
          generation: { name: "III", year_start: 2020 },
          generations: [{ name: "III", configurations: 1 }],
          existing: [{ engine: { code: "H4D", power_kw: 67 }, body_style: "SEDAN", year_start: 2021 }],
        });
        // By default only generations without configurations: Logan III has one.
        expect((await api.get("/admin/vehicle-catalog/tasks?make=Dacia&max_configurations=", auth)).data.count).toBe(1);
      });

      it("rejects a malformed file and requires admin authentication", async () => {
        const auth = await apiKeyHeaders();
        const bad = await api
          .post("/admin/vehicle-catalog/import?dry_run=true", { format: "vehicle-catalog@1", makes: [] }, auth)
          .catch((e: any) => e.response);
        expect(bad.status).toBe(400);
        const anonymous = await api.get("/admin/vehicle-catalog/coverage").catch((e: any) => e.response);
        expect(anonymous.status).toBe(401);
      });
    });
  },
});
