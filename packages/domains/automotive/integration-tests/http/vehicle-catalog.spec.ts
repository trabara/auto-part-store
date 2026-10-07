import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
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
  testSuite: ({ getContainer }) => {
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
  },
});
