import { findSlotRoute, getRoutePath } from "@repo/framework/core";
import parts from "../admin/modules/parts";
import { partsRoutes } from "../api/admin/parts/entities";

describe("parts admin module", () => {
  it("defines a feature per exposed entity under /parts", () => {
    expect(Object.keys(parts.features)).toEqual(["brand", "part_number"]);
    expect(Object.values(parts.features).map((f) => getRoutePath(findSlotRoute(f, "list")!.scope))).toEqual([
      "/parts/brands",
      "/parts/part-numbers",
    ]);
    const features = Object.values(parts.features).map((f) => f.entity.name).sort();
    expect(features).toEqual(partsRoutes.entities.map((e) => e.name).sort());
  });

  it("keeps server-managed brand fields out of the form", () => {
    expect(Object.keys(parts.features.brand.entity.dto.create.shape)).toEqual(["name", "logo", "kind"]);
  });
});
