import { condense, taskTerms } from "../condense";

const filler = (n: number) => Array.from({ length: n }, (_, i) => `History paragraph ${i} about the brand and its racing heritage.`).join("\n");
const page = [
  "The Renault Clio is a supermini car produced by Renault since 1990.",
  "## History",
  filler(200),
  "## Fifth generation (BF; 2019)",
  "The Clio V was unveiled in 2019.",
  "| Engine | Power | Years |",
  "| 1.5 dCi 85 | 85 ch (63 kW) | 2019–2023 |",
  "| 1.0 TCe 90 | 90 ch | 2019– |",
  "## Fourth generation (2012)",
  "| 1.2 16V | 75 ch | 2012–2016 |",
  "## Reception",
  filler(100),
].join("\n");

describe("condense", () => {
  it("keeps the task's section and the specifications within the budget", () => {
    const out = condense(page, { terms: taskTerms({ model: "Clio", generation: { name: "V", code: "BF", year_start: 2019, year_end: null } }), budget: 1_500 });
    expect(out.length).toBeLessThanOrEqual(1_500);
    expect(out).toContain("The Renault Clio is a supermini");
    expect(out).toContain("| 1.5 dCi 85 | 85 ch (63 kW) | 2019–2023 |");
    expect(out).toContain("## Fifth generation (BF; 2019)");
    expect(out).not.toContain("History paragraph 150");
  });

  it("returns short pages whole, without links and reference marks", () => {
    expect(condense("See [the Clio](https://x/Clio)[1] — 85 ch.")).toBe("See the Clio — 85 ch.");
  });
});
