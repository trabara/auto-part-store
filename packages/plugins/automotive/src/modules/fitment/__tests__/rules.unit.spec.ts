import FitmentModuleService from "../service";

// The rule methods are pure: use them without a container.
const rules = Object.create(FitmentModuleService.prototype) as FitmentModuleService;

type DataType = "string" | "number" | "boolean" | "date" | "enum";

const attr = (code: string, data_type: DataType = "string") => ({ code, data_type });

const cond = (
  code: string,
  operator: string,
  value: string,
  opts: { data_type?: DataType; value_to?: string } = {},
) =>
  ({
    operator,
    value,
    value_to: opts.value_to ?? null,
    attribute: attr(code, opts.data_type),
  }) as any;

const group = (operator: "and" | "or", conditions: any[] = [], children: any[] = []) =>
  ({ operator, conditions, children }) as any;

describe("evaluateCondition", () => {
  it.each([
    ["eq", "FWD", "FWD", true],
    ["eq", "FWD", "AWD", false],
    ["neq", "FWD", "AWD", true],
    ["in", "FWD, AWD", "AWD", true],
    ["in", "FWD, AWD", "RWD", false],
    ["not_in", "FWD, AWD", "RWD", true],
  ])("string %s %s against %s → %s", (operator, value, actual, expected) => {
    expect(rules.evaluateCondition(cond("drive", operator, value), { drive: actual })).toBe(expected);
  });

  it.each([
    ["gt", "100", 150, true],
    ["gte", "100", 100, true],
    ["lt", "100", 100, false],
    ["lte", "100", 100, true],
    ["eq", "100", 100, true],
  ])("number %s %s against %s → %s", (operator, value, actual, expected) => {
    expect(
      rules.evaluateCondition(cond("power", operator, value, { data_type: "number" }), { power: actual }),
    ).toBe(expected);
  });

  it("between is inclusive on both ends", () => {
    const c = cond("year", "between", "2015", { data_type: "number", value_to: "2020" });
    expect([2014, 2015, 2020, 2021].map((year) => rules.evaluateCondition(c, { year }))).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });

  it("parses booleans", () => {
    const c = cond("turbo", "eq", "true", { data_type: "boolean" });
    expect(rules.evaluateCondition(c, { turbo: true })).toBe(true);
    expect(rules.evaluateCondition(c, { turbo: false })).toBe(false);
  });

  it("enum attributes compare as strings", () => {
    const c = cond("fuel", "eq", "DIESEL", { data_type: "enum" });
    expect(rules.evaluateCondition(c, { fuel: "DIESEL" })).toBe(true);
  });

  it("a missing attribute never matches, even for negative operators", () => {
    expect(rules.evaluateCondition(cond("drive", "neq", "FWD"), {})).toBe(false);
    expect(rules.evaluateCondition(cond("drive", "not_in", "FWD"), { drive: null })).toBe(false);
  });

  it("an unknown operator never matches", () => {
    expect(rules.evaluateCondition(cond("drive", "like", "FWD"), { drive: "FWD" })).toBe(false);
  });

  // Known bugs, pinned: these fail today. When one is fixed, Jest reports it
  // — turn it into a regular `it`.
  it.failing("BUG: date eq matches the same date (compares Date objects by reference)", () => {
    const c = cond("built", "eq", "2020-01-01", { data_type: "date" });
    expect(rules.evaluateCondition(c, { built: new Date("2020-01-01") })).toBe(true);
  });

  it.failing("BUG: in supports values containing commas (value is comma-split)", () => {
    const c = cond("trim", "in", "Sport, Line", {});
    expect(rules.evaluateCondition(c, { trim: "Sport, Line" })).toBe(true);
  });
});

describe("evaluateGroup", () => {
  const fwd = cond("drive", "eq", "FWD");
  const diesel = cond("fuel", "eq", "DIESEL");

  it("and needs every condition, or needs one", () => {
    const attrs = { drive: "FWD", fuel: "GASOLINE" };
    expect(rules.evaluateGroup(group("and", [fwd, diesel]), attrs)).toBe(false);
    expect(rules.evaluateGroup(group("or", [fwd, diesel]), attrs)).toBe(true);
  });

  it("nests child groups", () => {
    // drive = FWD AND (fuel = DIESEL OR power > 150)
    const g = group("and", [fwd], [
      group("or", [diesel, cond("power", "gt", "150", { data_type: "number" })]),
    ]);
    expect(rules.evaluateGroup(g, { drive: "FWD", fuel: "GASOLINE", power: 200 })).toBe(true);
    expect(rules.evaluateGroup(g, { drive: "FWD", fuel: "GASOLINE", power: 100 })).toBe(false);
  });

  it("an empty group matches", () => {
    expect(rules.evaluateGroup(group("or"), {})).toBe(true);
  });
});

describe("filterCompatible", () => {
  const onlyDiesel = { id: "f1", conditionGroups: [group("and", [cond("fuel", "eq", "DIESEL")])] };
  const anyCar = { id: "f2", conditionGroups: [] };
  const twoGroups = {
    id: "f3",
    conditionGroups: [group("and", [cond("fuel", "eq", "DIESEL")]), group("and", [cond("drive", "eq", "AWD")])],
  };

  it("keeps fitments without conditions and those whose groups all match", () => {
    const ids = (attrs: object) => rules.filterCompatible([onlyDiesel, anyCar, twoGroups] as any, attrs).map((f: any) => f.id);
    expect(ids({ fuel: "DIESEL", drive: "FWD" })).toEqual(["f1", "f2"]);
    expect(ids({ fuel: "DIESEL", drive: "AWD" })).toEqual(["f1", "f2", "f3"]);
    expect(ids({})).toEqual(["f2"]);
  });
});
