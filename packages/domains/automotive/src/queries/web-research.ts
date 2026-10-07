// The research gateway: how the catalog steward reads the web. Free sources
// first (Wikipedia's API, then a direct fetch of the page), Tavily only when a
// page can't be read directly or for open web search, and everything cached
// (pages 30 days, searches 7): sibling tasks share what one already read, and
// answers are checked against the cached page. Behind an interface, so the
// provider can change.
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { Modules } from "@medusajs/framework/utils";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { parse } from "node-html-parser";

export type WikiHit = { title: string; url: string; snippet: string };
export type SearchHit = { title: string; url: string; content: string };
export type Page = { url: string; text: string; via: "cache" | "wikipedia" | "fetch" | "tavily"; credits: number };

export interface WebResearch {
  /** Wikipedia articles matching a query (free). */
  wikiSearch(query: string, lang?: string): Promise<WikiHit[]>;
  /** Web results with their most relevant passages (Tavily: 1 credit). */
  webSearch(query: string): Promise<{ results: SearchHit[]; credits: number; note?: string }>;
  /** A page as markdown, from the cache, Wikipedia's API, a direct fetch or Tavily. */
  read(url: string): Promise<Page>;
  /** A page already read (quote checks), or null. */
  cachedPage(url: string): Promise<string | null>;
  /** Puts a page in the cache (tests, sources read elsewhere). */
  remember(url: string, text: string): Promise<void>;
}

type Cache = { get(key: string): Promise<any>; set(key: string, value: unknown, ttlSeconds: number): Promise<void> };
type Container = { resolve: <T = any>(key: string) => T };

const DAY = 86_400;
/** Last-resort cache, shared by the whole process (one map however often this file is loaded). */
const memory: Map<string, { value: unknown; until: number }> = ((globalThis as any).__catalogStewardCache ??= new Map());

/** The Redis-backed caching module when the app has it, else this process. */
function cacheOf(container: Container): Cache {
  const resolve = (key: string) => {
    try {
      return container.resolve<any>(key);
    } catch {
      return undefined; // not registered
    }
  };
  const caching = resolve(Modules.CACHING);
  if (caching?.get && caching?.set) {
    return { get: (key) => caching.get({ key }), set: (key, data, ttl) => caching.set({ key, data, ttl, tags: [] }) };
  }
  // Not the legacy in-memory cache module: it expires through setTimeout, which
  // overflows past ~24.8 days (our pages live 30) and drops entries at once.
  return {
    get: async (key) => {
      const hit = memory.get(key);
      return hit && hit.until > Date.now() ? hit.value : null;
    },
    set: async (key, value, ttl) => void memory.set(key, { value, until: Date.now() + ttl * 1000 }),
  };
}

const hash = (value: string) => createHash("sha1").update(value).digest("hex");
const html2md = new NodeHtmlMarkdown({ ignore: ["script", "style", "noscript", "nav", "footer", "header", "form", "svg", "button", "iframe"], keepDataImages: false });

/** What a page carries besides its content: navigation boxes, references, notices, media, edit links. */
const NOISE = [
  "script", "style", "noscript", "figure", "img", "picture", "video", "audio",
  ".navbox", ".navbox-styles", ".vertical-navbox", ".sidebar", ".reflist", ".references", ".mw-references-wrap",
  ".hatnote", ".metadata", ".ambox", ".sistersitebox", ".noprint", ".mw-editsection", ".shortdescription",
  ".portalbox", ".authority-control", ".catlinks", "sup.reference",
].join(",");

/** Readable markdown from a page's HTML: its noise removed, links reduced to their text. */
export function htmlToMarkdown(html: string): string {
  const root = parse(html, { comment: false });
  root.querySelectorAll(NOISE).forEach((el) => el.remove());
  root.querySelectorAll("a").forEach((a) => a.replaceWith(a.innerHTML));
  return html2md
    .translate(root.toString())
    .replace(/\[\]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Resolver = (host: string) => Promise<{ address: string }[]>;

/** Private, loopback, link-local or otherwise internal addresses (IPv4, IPv6, mapped). */
export function internalAddress(ip: string): boolean {
  const v = ip.toLowerCase();
  if (net.isIPv6(v)) {
    if (v.startsWith("::ffff:")) return internalAddress(v.slice(7));
    return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  return [/^0\./, /^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./].some((r) => r.test(v));
}

/**
 * Refuses what the steward must never read: other schemes, cluster names
 * (single-label hosts, localhost, .internal, .local) and hosts resolving to
 * internal addresses. The agent picks URLs from pages it read, which anyone
 * can write.
 */
export async function assertPublicUrl(url: string, resolve: Resolver = (h) => lookup(h, { all: true })): Promise<void> {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error(`${u.protocol} URLs are not read`);
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (net.isIP(host)) {
    if (internalAddress(host)) throw new Error(`${host} is an internal address`);
    return;
  }
  if (!host.includes(".") || /(^|\.)(localhost|internal|local|lan|home|cluster\.local)$/.test(host)) throw new Error(`${host} is not a public host`);
  const addresses = await resolve(host);
  if (!addresses.length || addresses.some((a) => internalAddress(a.address))) throw new Error(`${host} resolves to an internal address`);
}

/** `https://fr.wikipedia.org/wiki/Renault_Clio` → { lang: "fr", title: "Renault_Clio" }. */
export function wikipediaPage(url: string): { lang: string; title: string } | null {
  const m = url.match(/^https?:\/\/([a-z-]+)\.(?:m\.)?wikipedia\.org\/wiki\/([^?#]+)/i);
  return m ? { lang: m[1]!.toLowerCase(), title: decodeURIComponent(m[2]!) } : null;
}

export function webResearch(
  container: Container,
  options: { fetch?: typeof fetch; tavilyKey?: string | null; userAgent?: string; blocked?: string[]; resolve?: Resolver } = {},
): WebResearch {
  const fetcher = options.fetch ?? fetch;
  const cache = cacheOf(container);
  const tavilyKey = options.tavilyKey === undefined ? process.env.TAVILY_API_KEY : options.tavilyKey;
  const userAgent =
    options.userAgent ?? process.env.WEB_RESEARCH_USER_AGENT ?? "medusa-erp-catalog-steward/1.0 (vehicle catalog research)";
  const blocked = (options.blocked ?? (process.env.WEB_RESEARCH_BLOCKED_DOMAINS ?? "").split(","))
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const isBlocked = (url: string) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return blocked.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return true;
    }
  };
  const get = async (url: string, accept = "text/html,application/xhtml+xml") => {
    // Redirects followed by hand: each hop must be public too.
    let current = url;
    for (let hop = 0; hop < 5; hop++) {
      await assertPublicUrl(current, options.resolve);
      const res = await fetcher(current, { headers: { "user-agent": userAgent, accept }, redirect: "manual", signal: AbortSignal.timeout(20_000) });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!location) return res;
      current = new URL(location, current).toString();
    }
    throw new Error(`Too many redirects from ${url}`);
  };
  const tavily = async (path: "search" | "extract", body: Record<string, unknown>) => {
    const res = await fetcher(`https://api.tavily.com/${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${tavilyKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Tavily ${path} failed (${res.status})`);
    return (await res.json()) as any;
  };
  /** Tavily within 90% of its plan (usage checked every 10 minutes). */
  const tavilyAllowed = async () => {
    if (!tavilyKey) return false;
    const key = "web:tavily:usage";
    let usage = await cache.get(key);
    if (!usage) {
      try {
        const res = await fetcher("https://api.tavily.com/usage", { headers: { authorization: `Bearer ${tavilyKey}` }, signal: AbortSignal.timeout(10_000) });
        const body = res.ok ? ((await res.json()) as any) : {};
        const plan = body.account ?? body.key ?? {};
        usage = { used: plan.plan_usage ?? plan.usage ?? 0, limit: plan.plan_limit ?? plan.limit ?? null };
      } catch {
        usage = { used: 0, limit: null };
      }
      await cache.set(key, usage, 600);
    }
    return usage.limit == null || usage.used < 0.9 * usage.limit;
  };
  const store = async (url: string, text: string) => cache.set(`web:page:${hash(url)}`, { url, text, at: new Date().toISOString() }, 30 * DAY);

  return {
    async wikiSearch(query, lang = "en") {
      const key = `web:wiki:${lang}:${hash(query)}`;
      const hit = await cache.get(key);
      if (hit) return hit as WikiHit[];
      const api = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&utf8=1&srlimit=5&srsearch=${encodeURIComponent(query)}`;
      const res = await get(api, "application/json");
      if (!res.ok) return [];
      const body = (await res.json()) as any;
      const hits: WikiHit[] = (body.query?.search ?? []).map((s: any) => ({
        title: s.title,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(s.title).replace(/ /g, "_"))}`,
        snippet: String(s.snippet ?? "").replace(/<[^>]+>/g, ""),
      }));
      await cache.set(key, hits, 7 * DAY);
      return hits;
    },

    async webSearch(query) {
      const key = `web:search:${hash(query)}`;
      const hit = await cache.get(key);
      if (hit) return { results: hit as SearchHit[], credits: 0 };
      if (!(await tavilyAllowed())) return { results: [], credits: 0, note: "Web search unavailable (no Tavily key, or its plan is nearly used up): use wiki_search." };
      const body = await tavily("search", { query, search_depth: "basic", max_results: 5, chunks_per_source: 3 });
      const results: SearchHit[] = (body.results ?? [])
        .filter((r: any) => !isBlocked(r.url))
        .map((r: any) => ({ title: r.title, url: r.url, content: r.content }));
      await cache.set(key, results, 7 * DAY);
      return { results, credits: 1 };
    },

    async read(url) {
      if (isBlocked(url)) throw new Error(`${new URL(url).hostname} is on the blocklist`);
      const cached = await cache.get(`web:page:${hash(url)}`);
      if (cached?.text) return { url, text: cached.text, via: "cache", credits: 0 };
      await assertPublicUrl(url, options.resolve);
      const wiki = wikipediaPage(url);
      if (wiki) {
        const res = await get(`https://${wiki.lang}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(wiki.title)}`);
        if (res.ok) {
          const text = htmlToMarkdown(await res.text());
          await store(url, text);
          return { url, text, via: "wikipedia", credits: 0 };
        }
      }
      try {
        const res = await get(url);
        const type = res.headers.get("content-type") ?? "";
        if (res.ok && type.includes("html")) {
          const text = htmlToMarkdown(await res.text());
          if (text.length >= 500) {
            await store(url, text);
            return { url, text, via: "fetch", credits: 0 };
          }
        }
      } catch {
        // Blocked or unreachable: Tavily may still read it.
      }
      if (!(await tavilyAllowed())) throw new Error(`Could not read ${url} (and Tavily is unavailable)`);
      const body = await tavily("extract", { urls: [url], extract_depth: "basic", format: "markdown" });
      const text = String(body.results?.[0]?.raw_content ?? "");
      if (!text) throw new Error(`Could not read ${url}`);
      await store(url, text);
      return { url, text, via: "tavily", credits: 1 };
    },

    async cachedPage(url) {
      const cached = await cache.get(`web:page:${hash(url)}`);
      return cached?.text ?? null;
    },

    remember: store,
  };
}
