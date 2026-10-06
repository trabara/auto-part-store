import { conditionAttribute, conditionAttributes } from "../../modules/fitment/conditions";
import { registerVehicleConditions, VEHICLE_ATTRIBUTES } from "../vehicle-attributes";

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

  it("registers with the fitment module", () => {
    registerVehicleConditions();
    expect(conditionAttributes()).toBe(VEHICLE_ATTRIBUTES);
    expect(conditionAttribute("engine.fuel")?.label).toBe("Fuel");
  });
});
