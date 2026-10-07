// A page cut down to what a catalog task needs, within a character budget: a
// small local model reads every character (prefill dominates on a CPU), so
// sections are ranked by the task's terms (generation name, code, years) and
// by specification content, and within them only headings, table rows and
// lines with specifications or task terms are kept. Pure.

/** Words that mark engine and configuration specifications (English and French). */
const SPEC = /\b(\d+\s?(kw|ch|cv|ps|hp|bhp|cm3|cm³|cc|l)\b|engine|moteur|motorisation|motorisations|power|puissance|gearbox|boite|boîte|transmission|diesel|essence|petrol|gasoline|hybrid|hybride|electric|électrique|displacement|cylindr\w*|tce|dci|tdi|tsi|hdi|bluehdi|puretech|ecoboost|crdi|gdi)\b/i;
const YEARS = /\b(19[5-9]\d|20[0-4]\d)\b/;

type Section = { index: number; heading: string; lines: string[]; score: number };

const clean = (text: string) =>
  text
    .replace(/\r/g, "")
    .replace(/\[(\d+|[a-z])\]/gi, "") // reference marks [1], [a]
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

/**
 * The most relevant parts of `markdown` for `terms`, at most `budget`
 * characters: the opening lines, then the best sections in page order.
 */
export function condense(markdown: string, options: { terms?: string[]; budget?: number } = {}): string {
  const budget = options.budget ?? 12_000;
  const terms = (options.terms ?? []).map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 2);
  const text = clean(markdown);
  if (text.length <= budget) return text.trim();

  const has = (line: string) => {
    const l = line.toLowerCase();
    return terms.filter((t) => l.includes(t)).length;
  };
  const sections: Section[] = [];
  let current: Section = { index: 0, heading: "", lines: [], score: 0 };
  for (const line of text.split("\n")) {
    if (/^#{1,6}\s/.test(line)) {
      sections.push(current);
      current = { index: sections.length, heading: line.trim(), lines: [], score: 0 };
    } else if (line.trim()) current.lines.push(line);
  }
  sections.push(current);

  for (const s of sections) {
    const tableRows = s.lines.filter((l) => l.trim().startsWith("|") && /\d/.test(l)).length;
    const specLines = s.lines.filter((l) => SPEC.test(l)).length;
    s.score = 5 * has(s.heading) + 2 * s.lines.reduce((n, l) => n + has(l), 0) + specLines + 2 * tableRows + (SPEC.test(s.heading) ? 5 : 0);
  }
  // Keep a section's useful lines: headings, table rows, specifications, task terms, years.
  const useful = (s: Section) =>
    [s.heading, ...s.lines.filter((l) => l.trim().startsWith("|") || SPEC.test(l) || has(l) > 0 || YEARS.test(l))].filter(Boolean).join("\n");

  const opening = sections[0]!.lines.join("\n").slice(0, 1_200);
  let used = opening.length;
  const chosen = new Set<number>();
  for (const s of [...sections.slice(1)].sort((a, b) => b.score - a.score)) {
    if (s.score <= 0) break;
    const part = useful(s);
    if (used + part.length + 2 > budget) {
      // A large but relevant section: keep its best lines that fit.
      if (!chosen.size && part.length) {
        chosen.add(s.index);
        (s as Section & { cut?: string }).cut = part.slice(0, budget - used - 2);
        used = budget;
      }
      continue;
    }
    chosen.add(s.index);
    used += part.length + 2;
  }
  const parts = [opening, ...sections.filter((s) => chosen.has(s.index)).map((s) => (s as Section & { cut?: string }).cut ?? useful(s))];
  return parts.filter(Boolean).join("\n\n").slice(0, budget).trim();
}

/** The terms a task's evidence is condensed around. */
export function taskTerms(task: { model: string; generation?: { name: string; code: string | null; year_start: number; year_end: number | null } | null }): string[] {
  const g = task.generation;
  const terms = [task.model, "generation", "génération", "production"];
  if (g) {
    terms.push(g.name, String(g.year_start));
    if (g.code) terms.push(g.code);
    if (g.year_end) terms.push(String(g.year_end));
  }
  return terms;
}
