// What a catalog task's model reads: the most relevant pages (those the
// catalog already cites, else Wikipedia's best match), condensed around the
// task's terms within a budget a CPU model can prefill quickly.
import type { PromptEvidence, StewardContext } from "@repo/module-vehicle/core";
import { condense, taskTerms } from "../core/condense";
import type { WebResearch } from "./web-research";

const isWikipedia = (url: string) => /\.wikipedia\.org\/wiki\//i.test(url);

export async function stewardEvidence(
  research: WebResearch,
  context: StewardContext,
  knownUrls: string[],
  options: { budget?: number; pages?: number } = {},
): Promise<{ evidence: PromptEvidence[]; credits: number }> {
  const budget = options.budget ?? 12_000;
  const terms = taskTerms({ model: context.model.name, generation: context.generation ?? null });
  // Wikipedia first (free and structured), then the other pages the catalog cites.
  let urls = [...knownUrls.filter(isWikipedia), ...knownUrls.filter((u) => !isWikipedia(u))];
  if (!urls.length) {
    const query = `${context.make.name} ${context.model.name}`;
    for (const lang of ["en", "fr"]) {
      const hits = await research.wikiSearch(query, lang);
      const model = context.model.name.toLowerCase();
      const best = hits.find((h) => h.title.toLowerCase().includes(model)) ?? null;
      if (best) {
        urls = [best.url];
        break;
      }
    }
  }
  const evidence: PromptEvidence[] = [];
  let credits = 0;
  let left = budget;
  for (const url of urls.slice(0, options.pages ?? 2)) {
    if (left < 1_500) break;
    try {
      const page = await research.read(url);
      credits += page.credits;
      const text = condense(page.text, { terms, budget: left });
      if (text.length < 100) continue; // nothing useful on the page
      evidence.push({ url, text });
      left -= text.length;
    } catch {
      // Unreadable: try the next page.
    }
  }
  return { evidence, credits };
}
