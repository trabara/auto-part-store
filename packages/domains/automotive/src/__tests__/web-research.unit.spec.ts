import { assertPublicUrl, htmlToMarkdown, internalAddress, webResearch, wikipediaPage } from "../queries/web-research";

const resolve = async () => [{ address: "93.184.216.34" }];

const container = { resolve: () => undefined } as any; // no caching module: the process cache
const html = (body: string) => `<html><body>${body}</body></html>`;

function fakeFetch(routes: Record<string, { status?: number; type?: string; body: string }>) {
  const calls: string[] = [];
  const fetcher = (async (url: string) => {
    calls.push(String(url));
    const route = routes[String(url)];
    if (!route) return new Response("not found", { status: 404 });
    return new Response(route.body, { status: route.status ?? 200, headers: { "content-type": route.type ?? "text/html" } });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

describe("web research gateway", () => {
  it("reads Wikipedia through its API, for free, and caches the page", async () => {
    const { fetcher, calls } = fakeFetch({
      "https://fr.wikipedia.org/api/rest_v1/page/html/Renault_Clio_V": {
        body: html('<p>La <a href="./Renault">Renault</a> Clio V<sup class="reference">[1]</sup> (2019).</p><div class="navbox">Modèles Renault</div><table><tr><td>1.0 TCe</td><td>90 ch</td></tr></table>'),
      },
    });
    const research = webResearch(container, { fetch: fetcher, tavilyKey: null, resolve });
    const page = await research.read("https://fr.wikipedia.org/wiki/Renault_Clio_V");
    expect(page).toMatchObject({ via: "wikipedia", credits: 0 });
    expect(page.text).toContain("La Renault Clio V (2019).");
    expect(page.text).toContain("90 ch");
    expect(page.text).not.toContain("Modèles Renault");
    expect(page.text).not.toContain("[1]");
    expect((await research.read("https://fr.wikipedia.org/wiki/Renault_Clio_V")).via).toBe("cache");
    expect(calls).toHaveLength(1);
    expect(await research.cachedPage("https://fr.wikipedia.org/wiki/Renault_Clio_V")).toContain("90 ch");
  });

  it("fetches other pages directly, and needs Tavily only when that fails", async () => {
    const long = `<p>${"Fiche technique Dacia Sandero 1.0 TCe 90 ch. ".repeat(20)}</p>`;
    const { fetcher, calls } = fakeFetch({
      "https://example.tn/sandero": { body: html(long) },
      "https://api.tavily.com/usage": { type: "application/json", body: JSON.stringify({ key: { usage: 10, limit: 1000 } }) },
      "https://api.tavily.com/extract": { type: "application/json", body: JSON.stringify({ results: [{ raw_content: "Logan 1.5 dCi 95 ch" }] }) },
    });
    const research = webResearch(container, { fetch: fetcher, tavilyKey: "tvly-test", resolve });
    expect(await research.read("https://example.tn/sandero")).toMatchObject({ via: "fetch", credits: 0 });
    // A JavaScript page (nothing readable directly): Tavily reads it, one credit.
    expect(await research.read("https://example.tn/logan-js")).toMatchObject({ via: "tavily", credits: 1, text: "Logan 1.5 dCi 95 ch" });
    expect(calls.filter((c) => c.includes("tavily.com/extract"))).toHaveLength(1);
  });

  it("refuses blocklisted sites and says when web search is unavailable", async () => {
    const research = webResearch(container, { fetch: fakeFetch({}).fetcher, tavilyKey: null, blocked: ["blocked.example"], resolve });
    await expect(research.read("https://www.blocked.example/page")).rejects.toThrow(/blocklist/);
    expect(await research.webSearch("clio v moteurs")).toMatchObject({ results: [], credits: 0, note: expect.stringContaining("wiki_search") });
  });

  it("recognises Wikipedia article URLs", () => {
    expect(wikipediaPage("https://en.m.wikipedia.org/wiki/Dacia_Logan#Third_generation")).toEqual({ lang: "en", title: "Dacia_Logan" });
    expect(wikipediaPage("https://example.com/wiki/x")).toBeNull();
    expect(htmlToMarkdown('<p><a href="x">Clio</a></p>')).toBe("Clio");
  });

  it("never reads internal addresses, even through a redirect", async () => {
    expect(internalAddress("10.0.0.5")).toBe(true);
    expect(internalAddress("169.254.169.254")).toBe(true);
    expect(internalAddress("::ffff:127.0.0.1")).toBe(true);
    expect(internalAddress("93.184.216.34")).toBe(false);
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(/internal/);
    await expect(assertPublicUrl("http://minio:9000/bucket")).rejects.toThrow(/public/);
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow(/not read/);
    await expect(assertPublicUrl("https://evil.example/x", async () => [{ address: "192.168.1.10" }])).rejects.toThrow(/internal/);
    const { fetcher } = fakeFetch({ "https://example.tn/go": { status: 302, body: "", type: "text/html" } });
    const redirecting = (async (url: string) =>
      String(url) === "https://example.tn/go" ? new Response("", { status: 302, headers: { location: "http://127.0.0.1:9000/" } }) : fetcher(url)) as unknown as typeof fetch;
    const research = webResearch(container, { fetch: redirecting, tavilyKey: null, resolve });
    await expect(research.read("https://example.tn/go")).rejects.toThrow(/Could not read/);
  });
});
