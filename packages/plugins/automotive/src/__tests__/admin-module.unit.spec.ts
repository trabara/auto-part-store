import { findSlotRoute, flattenModuleRoutes, getRoutePath } from "@repo/framework/core";
import automotive from "../admin/modules/automotive";
import { automotiveRoutes } from "../api/admin/automotive/entities";

describe("automotive admin module", () => {
  it("defines a CRUD feature per exposed entity, with valid relations and steps", () => {
    expect(Object.keys(automotive.features)).toEqual([
      "vehicle",
      "vehicle_engine",
      "vehicle_make",
      "vehicle_model",
      "vehicle_generation",
      "vehicle_reference",
      "customer_vehicle",
      "fitment",
      "fitment_position",
    ]);
    expect(automotive.features.vehicle.ui.steps?.map((s) => s.id)).toEqual(["general", "specs"]);
  });

  it("routes each feature under /automotive/<plural>", () => {
    const lists = Object.values(automotive.features).map((f) =>
      getRoutePath(findSlotRoute(f, "list")!.scope),
    );
    expect(lists).toEqual([
      "/automotive/vehicles",
      "/automotive/vehicle-engines",
      "/automotive/vehicle-makes",
      "/automotive/vehicle-models",
      "/automotive/vehicle-generations",
      "/automotive/vehicle-references",
      "/automotive/customer-vehicles",
      "/automotive/fitments",
      "/automotive/fitment-positions",
    ]);
    expect(flattenModuleRoutes(automotive)).toHaveLength(36);
  });

  it("matches the entities exposed by the API", () => {
    const features = Object.values(automotive.features).map((f) => f.entity.name).sort();
    const exposed = automotiveRoutes.entities.map((e) => e.name).sort();
    expect(features).toEqual(exposed);
  });
});
