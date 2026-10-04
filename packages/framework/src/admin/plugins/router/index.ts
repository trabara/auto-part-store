import fs from "node:fs";
import path from "node:path";
import { RUNTIME_SOURCE } from "./runtime-source";

export type MedusaRouterExtOptions = {
  /**
   * "pathless" (default): `(group)` adds no URL segment, like Next.js.
   * "medusa": keep Medusa's native behaviour, where `(group)` is an optional segment.
   */
  groups?: "pathless" | "medusa";
  debug?: boolean;
};

const ROUTES_ID = "\0virtual:medusa/routes";
const MENU_ID = "\0virtual:medusa/menu-items";
const RUNTIME_ID = "virtual:medusa-router-ext/runtime";
const RUNTIME_RESOLVED = "\0" + RUNTIME_ID;
const ROUTES_MARKER = "/admin/routes";
const EXTS = ["tsx", "jsx", "ts", "js"];

/**
 * Medusa 2.21.0 maps:  [*] -> *   [[*]] -> *?   [id] -> :id   [[id]] -> :id?   (g) -> g?
 * and mangles the Next-style forms:  [...s] -> :...s   [[...s]] -> :...s?
 */
export function rewritePath(
  p: string,
  groups: "pathless" | "medusa" = "pathless",
): string {
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (/^:\.\.\..+\?$/.test(seg)) out.push("*?");
    else if (/^:\.\.\..+$/.test(seg)) out.push("*");
    else if (groups === "pathless" && /^[^:*][^?]*\?$/.test(seg))
      continue; // (group) -> g?
    else out.push(seg);
  }
  return out.join("/") || "/";
}

export function rewritePaths(
  code: string,
  groups: "pathless" | "medusa" = "pathless",
): string {
  return code.replace(
    /(\bpath:\s*")([^"]*)(")/g,
    (_m, a, p, c) => a + rewritePath(p, groups) + c,
  );
}

type Boundaries = { layouts: string[]; loading?: string; error?: string };

const find = (dir: string, base: string) =>
  EXTS.map((e) => `${dir}/${base}.${e}`).find((f) => fs.existsSync(f));

export function resolveBoundaries(pageFile: string): Boundaries {
  const file = pageFile.split(path.sep).join("/");
  const idx = file.lastIndexOf(ROUTES_MARKER + "/");
  if (idx === -1) return { layouts: [] };
  const root = file.slice(0, idx + ROUTES_MARKER.length);
  const dirs = file
    .slice(root.length + 1)
    .split("/")
    .slice(0, -1);

  const b: Boundaries = { layouts: [] };
  let dir = root;
  for (let i = 0; i <= dirs.length; i++) {
    if (i > 0) dir += "/" + dirs[i - 1];
    const layout = find(dir, "layout");
    if (layout) b.layouts.push(layout);
    b.loading = find(dir, "loading") ?? b.loading; // deepest wins
    b.error = find(dir, "error") ?? b.error;
  }
  return b;
}

export function wrapComponents(
  code: string,
  resolve: (pageFile: string) => Boundaries = resolveBoundaries,
): { code: string; wrapped: number } {
  const pages = new Map<string, string>();
  for (const m of code.matchAll(
    /^import (RouteComponent\d+)(?:,\s*\{[^}]*\})? from "([^"]+)"$/gm,
  ))
    pages.set(m[1]!, m[2]!);
  if (!pages.size) return { code, wrapped: 0 };

  const imports = new Map<string, string>(); // file -> identifier
  const ident = (file: string) => {
    if (!imports.has(file)) imports.set(file, `__RouterExt${imports.size}`);
    return imports.get(file)!;
  };
  let wrapped = 0;
  const body = code.replace(
    /Component: (RouteComponent\d+)\b/g,
    (full, name) => {
      const file = pages.get(name);
      if (!file) return full;
      const b = resolve(file);
      if (!b.layouts.length && !b.loading && !b.error) return full;
      wrapped++;
      const opts = [
        b.loading && `Loading: ${ident(b.loading)}`,
        b.error && `Error: ${ident(b.error)}`,
      ]
        .filter(Boolean)
        .join(", ");
      return `Component: __withBoundaries(${name}, [${b.layouts.map(ident).join(", ")}], { ${opts} })`;
    },
  );
  if (!wrapped) return { code, wrapped };

  const head = [
    `import { withBoundaries as __withBoundaries } from "${RUNTIME_ID}"`,
    ...[...imports].map(([f, id]) => `import ${id} from ${JSON.stringify(f)}`),
  ].join("\n");
  return { code: head + "\n" + body, wrapped };
}

export function medusaRouterExt(opts: MedusaRouterExtOptions = {}) {
  const groups = opts.groups ?? "pathless";
  return {
    name: "medusa-admin-router-ext",

    resolveId(id: string) {
      return id === RUNTIME_ID ? RUNTIME_RESOLVED : null;
    },
    load(id: string) {
      return id === RUNTIME_RESOLVED ? RUNTIME_SOURCE : null;
    },

    // Runs after Medusa's own plugin has produced the virtual modules.
    transform(code: string, id: string) {
      if (id !== ROUTES_ID && id !== MENU_ID) return null;
      let out = rewritePaths(code, groups);
      if (id === ROUTES_ID) {
        const r = wrapComponents(out);
        out = r.code;
        if (r.wrapped === 0 && opts.debug)
          console.log("[router-ext] no layouts/loading/error found");
      }
      if (opts.debug) console.log(`[router-ext] ${id}\n${out}`);
      return { code: out, map: null };
    },

    configureServer(server: any) {
      // Medusa only watches page files; layout/loading/error add or remove must refresh the routes module.
      const re =
        /\/admin\/routes\/(?:.+\/)?(layout|loading|error)\.(tsx|jsx|ts|js)$/;
      const onChange = (file: string) => {
        if (!re.test(file.split(path.sep).join("/"))) return;
        for (const id of [ROUTES_ID, MENU_ID]) {
          const mod = server.moduleGraph.getModuleById(id);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
}
