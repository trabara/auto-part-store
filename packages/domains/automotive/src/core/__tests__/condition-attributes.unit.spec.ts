import { i18nKeys } from "@repo/framework/core";
import i18n from "../../contract/i18n";
import { conditionAttribute, conditionAttributes } from "@repo/module-fitment/contract";
import { composeAutomotive } from "../../composition";
import { VEHICLE_ATTRIBUTES } from "../condition-attributes";

const attr = (code: string) => VEHICLE_ATTRIBUTES.find((a) => a.code === code);

describe("vehicle attribute catalog", () => {
  it("is generated from the vehicle schemas, with types, units, groups and enum values", () => {
    expect(attr("drive")).toMatchObject({
      label: "Drive",
      data_type: "enum",
      group: "Vehicle",
      values: expect.arrayContaining([{ value: "FWD", label: "Front-wheel drive" }, { value: "FOUR_WD", label: "4×4" }]),
    });
    expect(attr("engine.power_kw")).toMatchObject({ label: "Power", data_type: "number", unit: "kW", group: "Engine" });
    expect(attr("engine.fuel")!.values!.map((v) => v.label)).toContain("Plug-in hybrid");
    expect(attr("generation.model.make.name")).toMatchObject({ label: "Make", data_type: "string", group: "Model" });
    expect(attr("generation.model.category")!.data_type).toBe("enum");
    expect(VEHICLE_ATTRIBUTES.map((a) => a.code)).not.toContain("id");
    // New conditions start on the drive (the editor's default is the first).
    expect(VEHICLE_ATTRIBUTES[0]!.code).toBe("drive");
  });

  it("is plugged into the fitment module by the composition root", () => {
    composeAutomotive();
    expect(conditionAttributes()).toBe(VEHICLE_ATTRIBUTES);
    expect(conditionAttribute("engine.fuel")?.label).toBe("Fuel");
  });
});

describe("vehicle attribute translations", () => {
  const resources = i18n.en.translation as Record<string, any>;
  const lookup = (key: string) => key.split(".").reduce<any>((node, k) => node?.[k], resources);

  it("has an English label (matching the catalog) and a group for every attribute", () => {
    for (const a of VEHICLE_ATTRIBUTES) {
      expect([a.code, lookup(a.i18n!.label!)]).toEqual([a.code, a.label]);
      expect([a.code, lookup(a.i18n!.group!)]).toEqual([a.code, a.group]);
    }
  });

  it("points enum attributes at the vehicle module's value labels", () => {
    for (const a of VEHICLE_ATTRIBUTES.filter((x) => x.data_type === "enum")) {
      const src = a.i18n!.values!;
      for (const v of a.values!) expect([a.code, typeof lookup(i18nKeys.value(src.entity, src.field, v.value))]).toEqual([a.code, "string"]);
    }
  });
});
