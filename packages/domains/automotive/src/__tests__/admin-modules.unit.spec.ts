import { findSlotRoute, flattenModuleRoutes, getRoutePath, type ModuleDef } from "@repo/framework/core";
import { getEntityUrl } from "@repo/framework/entity";
import { getZodFieldInfo } from "@repo/framework/utils";
import i18n from "../contract/i18n";
import { fitmentAdmin as fitments } from "@repo/module-fitment/admin";
import { fitmentRoutes } from "@repo/module-fitment";
import { partsAdmin as parts } from "@repo/module-parts/admin";
import { partsRoutes } from "@repo/module-parts";
import { vehicleAdmin as vehicles } from "@repo/module-vehicle/admin";
import { vehicleRoutes } from "@repo/module-vehicle";

const lists = (module: ModuleDef) =>
  Object.values(module.features).map((f) => getRoutePath(findSlotRoute(f, "list")!.scope));

describe.each([
  ["vehicles", vehicles, vehicleRoutes],
  ["fitments", fitments, fitmentRoutes],
  ["parts", parts, partsRoutes],
] as const)("%s admin module", (path, module, routes) => {
  it("lives at its own path, with a feature per entity of the module's API", () => {
    expect(module.path).toBe(path);
    const features = Object.values(module.features).map((f) => f.entity.name).sort();
    expect(features).toEqual(routes.entities.map((e) => e.name).sort());
  });

  it("reaches each entity through the module's own API path", () => {
    for (const entity of routes.entities) {
      expect(getEntityUrl(entity.name)).toBe(`/admin/${path}/${entity.modelName}`);
    }
  });
});

describe("admin routes", () => {
  it("uses short paths per module", () => {
    expect(lists(vehicles)).toEqual([
      "/vehicles/configurations",
      "/vehicles/makes",
      "/vehicles/models",
      "/vehicles/generations",
      "/vehicles/engines",
      "/vehicles/references",
      "/vehicles/garage",
    ]);
    expect(lists(fitments)).toEqual(["/fitments/fitments", "/fitments/positions", "/fitments/attributes"]);
    expect(lists(parts)).toEqual(["/parts/brands", "/parts/part-numbers"]);
    expect(flattenModuleRoutes(vehicles)).toHaveLength(28);
  });

  it("keeps the vehicle wizard steps", () => {
    expect(vehicles.features.vehicle.ui.steps?.map((s) => s.id)).toEqual(["general", "specs"]);
  });

  it("keeps server-managed brand fields out of the form", () => {
    expect(Object.keys(parts.features.brand.entity.dto.create.shape)).toEqual(["name", "logo", "kind"]);
  });
});

describe("admin translations", () => {
  const resources = i18n;
  const leafKeys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [`${prefix}${k}`] : leafKeys(v, `${prefix}${k}.`)));

  it("labels every feature and every enum value of each module, in every locale", () => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const t = resources[locale].translation;
      for (const module of [vehicles, fitments, parts]) {
        for (const feature of Object.values(module.features)) {
          expect(t.modules[module.path].features[feature.key]).toEqual(expect.any(String));
          const shape = feature.entity.schema.shape as Record<string, any>;
          for (const [field, schema] of Object.entries(shape)) {
            const info = getZodFieldInfo(schema);
            if (info.baseType !== "enum") continue;
            for (const value of info.enumValues ?? []) {
              expect([locale, feature.entity.name, field, value, t.entities[feature.entity.name]?.values?.[field]?.[value]]).toEqual([
                locale, feature.entity.name, field, value, expect.any(String),
              ]);
            }
          }
        }
      }
    }
  });

  it("has the same keys in every locale", () => {
    expect(leafKeys(resources.fr.translation)).toEqual(leafKeys(resources.en.translation));
    expect(leafKeys(resources.ar.translation)).toEqual(leafKeys(resources.en.translation));
  });
});
