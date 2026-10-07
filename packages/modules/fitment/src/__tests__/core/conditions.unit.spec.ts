import {
  conditionAttribute,
  provideConditionAttributes,
  type ConditionAttribute,
  type ConditionGroupInput,
  type ConditionTexts,
} from "../../contract";
import { deserializeCondition, englishConditionTexts, serializeValue, summarizeConditions, validateTree } from "../../core";

// The module knows no vehicle: tests register their own catalog.
const enumOf = (code: string, label: string, values: [string, string][]): ConditionAttribute => ({
  code,
  label,
  data_type: "enum",
  values: values.map(([value, label]) => ({ value, label })),
});
const CATALOG: ConditionAttribute[] = [
  enumOf("drive", "Drive", [["FWD", "Front-wheel drive"], ["AWD", "All-wheel drive"]]),
  enumOf("engine.fuel", "Fuel", [["DIESEL", "Diesel"], ["HYBRID", "Hybrid"], ["LPG", "LPG"], ["PLUG_IN_HYBRID", "Plug-in hybrid"]]),
  { code: "engine.power_kw", label: "Power", data_type: "number", unit: "kW" },
  { code: "trim", label: "Trim", data_type: "string" },
];

beforeAll(() => provideConditionAttributes(CATALOG));

const tree = (patch: Partial<ConditionGroupInput>): ConditionGroupInput => ({
  operator: "and",
  conditions: [],
  groups: [],
  ...patch,
});

describe("condition attribute port", () => {
  it("serves the registered catalog; a new registration replaces it", () => {
    expect(conditionAttribute("engine.power_kw")).toMatchObject({ unit: "kW" });
    provideConditionAttributes(() => [{ code: "colour", label: "Colour", data_type: "string" }]);
    expect(conditionAttribute("drive")).toBeUndefined();
    expect(conditionAttribute("colour")).toBeDefined();
    provideConditionAttributes(CATALOG);
  });
});

describe("validateTree", () => {
  it("accepts a valid nested tree", () => {
    const ok = tree({
      conditions: [{ code: "drive", operator: "eq", value: "FWD" }],
      groups: [
        tree({
          operator: "or",
          conditions: [
            { code: "engine.fuel", operator: "in", value: ["DIESEL", "HYBRID"] },
            { code: "engine.power_kw", operator: "between", value: 80, value_to: 110 },
          ],
        }),
      ],
    });
    expect(validateTree(ok)).toEqual([]);
  });

  it("explains each problem in plain words", () => {
    const bad = tree({
      conditions: [
        { code: "colour", operator: "eq", value: "red" },
        { code: "drive", operator: "gt", value: "FWD" },
        { code: "drive", operator: "eq", value: "HOVER" },
        { code: "engine.power_kw", operator: "between", value: 110, value_to: 80 },
        { code: "engine.fuel", operator: "in", value: [] },
        { code: "trim", operator: "eq", value: "" },
      ],
    });
    expect(validateTree(bad)).toEqual([
      'Conditions › #1: "colour" is not a known attribute.',
      'Conditions › #2: Drive can\'t use "is above".',
      "Conditions › #3: HOVER is not a valid drive.",
      "Conditions › #4: the upper bound of Power is below the lower one.",
      "Conditions › #5: Fuel needs at least one value.",
      "Conditions › #6: Trim needs a value.",
    ]);
  });

  it("limits nesting depth", () => {
    const deep = tree({ groups: [tree({ groups: [tree({ groups: [tree({})] })] })] });
    expect(validateTree(deep)[0]).toMatch(/nested 3 levels deep at most/);
  });
});

describe("storage round trip", () => {
  it("stores lists as JSON and types values back from the attribute", () => {
    const list = { code: "engine.fuel", operator: "in" as const, value: ["DIESEL", "LPG"] };
    expect(serializeValue(list)).toBe('["DIESEL","LPG"]');
    expect(
      deserializeCondition({ operator: "in", value: '["DIESEL","LPG"]', value_to: null, attribute: { code: "engine.fuel", data_type: "enum" } }),
    ).toEqual({ ...list, value_to: null });
    expect(
      deserializeCondition({ operator: "between", value: "80", value_to: "110", attribute: { code: "engine.power_kw", data_type: "number" } }),
    ).toEqual({ code: "engine.power_kw", operator: "between", value: 80, value_to: 110 });
  });
});

describe("summarizeConditions", () => {
  it("reads like a sentence, with labels, units and nested groups", () => {
    const t = tree({
      conditions: [{ code: "drive", operator: "eq", value: "FWD" }],
      groups: [
        tree({
          operator: "or",
          conditions: [
            { code: "engine.fuel", operator: "in", value: ["DIESEL", "PLUG_IN_HYBRID"] },
            { code: "engine.power_kw", operator: "between", value: 80, value_to: 110 },
          ],
        }),
      ],
    });
    expect(summarizeConditions(t)).toBe(
      "Drive is front-wheel drive and (Fuel is one of diesel, plug-in hybrid or Power is between 80 and 110 kW)",
    );
    expect(summarizeConditions(tree({ groups: [tree({})] }))).toBeNull();
    // While editing: empty values read as "…", not "null".
    expect(
      summarizeConditions(tree({ conditions: [{ code: "engine.power_kw", operator: "between", value: "", value_to: null }] })),
    ).toBe("Power is between … and …");
    expect(summarizeConditions(null)).toBeNull();
  });
});

describe("translated texts", () => {
  const fr: ConditionTexts = {
    attribute: (a) => ({ drive: "Transmission", "engine.power_kw": "Puissance", "engine.fuel": "Carburant" })[a.code] ?? a.label,
    value: (a, v) => ({ FWD: "Traction avant", DIESEL: "Gazole" })[v] ?? englishConditionTexts.value(a, v),
    operator: (op) => ({ eq: "est", between: "entre", gt: "supérieur à" })[op as string] ?? op,
    message: (key, vars) =>
      key === "and" ? "et" : key === "root" ? "Conditions" : key === "badOperator" ? `${vars!.attr} : « ${vars!.op} » n'est pas applicable.` : key,
  };

  it("summarizes and validates in the given language", () => {
    const t = tree({
      conditions: [
        { code: "drive", operator: "eq", value: "FWD" },
        { code: "engine.power_kw", operator: "between", value: 80, value_to: 110 },
      ],
    });
    expect(summarizeConditions(t, fr)).toBe("Transmission est traction avant et Puissance entre 80 et 110 kW");
    expect(validateTree(tree({ conditions: [{ code: "drive", operator: "gt", value: "FWD" }] }), fr)).toEqual([
      "Conditions › #1: Transmission : « supérieur à » n'est pas applicable.",
    ]);
  });
});
