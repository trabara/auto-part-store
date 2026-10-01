import fs from "node:fs"
import path from "node:path"

/**
 * Sidebar entries from ANY `export const config = defineRouteConfig(<expression>)`.
 *
 * Medusa decides what becomes a sidebar item by statically parsing each page.tsx, so it only
 * understands `defineRouteConfig({ label: "..." })` with an inline object literal. This plugin
 * reads configs at runtime instead, which allows:
 *
 *   defineRouteConfig({})                     -> route exists, no sidebar entry
 *   defineRouteConfig(makeConfig("Reports"))  -> label/rank/icon/... computed by a function
 *   defineRouteConfig({ items: [...] })       -> on a dynamic route ([feature]): one sidebar
 *                                                entry per item, no `label` needed
 *
 * Works in both places Medusa generates menu items:
 *  - application: the `virtual:medusa/menu-items` module (via `admin.vite` in medusa-config.ts)
 *  - plugin:      the `src/admin/__admin-extensions__.js` entry built by `medusa plugin:build`
 *                 (via a `vite.config.ts` at the plugin root)
 */

export type ExpandDynamicMenuItemsOptions = {
  /** Admin source dirs that contain a `routes/` folder. Defaults to [<cwd>/src/admin]. */
  sources?: string[]
}

const APP_MODULE = "\0virtual:medusa/menu-items"
const PLUGIN_ENTRY = /[\\/]src[\\/]admin[\\/]__admin-extensions__\.js$/

// Built-in sidebar sections that `nested` may target (mirrors NESTED_ROUTE_POSITIONS in @medusajs/admin-shared).
const NESTED_POSITIONS = ["/orders", "/products", "/inventory", "/customers", "/promotions", "/price-lists"]

const PAGE_FILE = /^page\.(tsx|jsx|js|ts)$/
const CONFIG_DECLARATION = /export\s+(?:const|let|var)\s+config\b/
const CONFIG_EXPORT_LIST = /export\s*\{(?:[^}]*,)?\s*config\s*(?:,[^}]*)?\}/

const TAG = "[expand-dynamic-menu-items]"
const debug = Boolean(process.env.EXPAND_DEBUG)
// Medusa runs plugin builds with Vite's logLevel "silent", which swallows this.warn().
// console.* is not affected, so use it for anything the developer must see.
const say = (message: string) => debug && console.log(`${TAG} ${message}`)
const shout = (message: string) => console.warn(`${TAG} ${message}`)

const normalize = (file: string) => path.normalize(file).replace(/\\/g, "/")

/** Same file -> route path mapping Medusa uses (getRoute in @medusajs/admin-vite-plugin). */
const toRoutePath = (file: string) =>
  normalize(file)
    .replace(/.*\/admin\/(routes)/, "")
    .replace("[[*]]", "*?")
    .replace("[*]", "*")
    .replace(/\(([^\[\]\)]+)\)/g, "$1?")
    .replace(/\[\[([^\]]+)\]\]/g, ":$1?")
    .replace(/\[([^\]]+)\]/g, ":$1")
    .replace(/\/page\.(tsx|jsx|js|ts)$/, "")

/** Mirrors Medusa's crawl: page files at least one folder deep, skipping `_`-prefixed folders. */
function crawlPages(dir: string, depth = 0, out: string[] = []): string[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith("_") && entry.name !== "node_modules") {
        crawlPages(path.join(dir, entry.name), depth + 1, out)
      }
    } else if (depth >= 1 && PAGE_FILE.test(entry.name)) {
      out.push(path.join(dir, entry.name))
    }
  }
  return out
}

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

const exportsConfig = (file: string) => {
  try {
    const source = stripComments(fs.readFileSync(file, "utf-8"))
    return CONFIG_DECLARATION.test(source) || CONFIG_EXPORT_LIST.test(source)
  } catch {
    return false
  }
}

/** Page files that export a `config` but that Medusa's static parser skipped. */
function findUnparsedRoutes(code: string, sources: string[]) {
  const parsed = new Set(
    [...code.matchAll(/import \{ config as RouteConfig\d+ \} from "([^"]+)"/g)].map((m) =>
      normalize(path.resolve(m[1]!))
    )
  )

  return sources
    .flatMap((source) => crawlPages(path.join(source, "routes")))
    .map((file) => normalize(path.resolve(file)))
    .filter((file) => !parsed.has(file) && exportsConfig(file))
    .sort()
    .map((file) => ({ file, routePath: toRoutePath(file) }))
}

const HELPER = /* js */ `
const __NESTED = ${JSON.stringify(NESTED_POSITIONS)}

const __expandMenuItems = (menuItems, extras) => {
  // 1) routes Medusa parsed statically: prefer runtime values where the static parse couldn't see them
  const all = menuItems.map(({ __config, ...item }) => {
    const cfg = __config ?? {}
    return {
      cfg,
      item: {
        ...item,
        icon: item.icon ?? cfg.icon,
        rank: typeof cfg.rank === "number" ? cfg.rank : item.rank,
        translationNs: cfg.translationNs ?? item.translationNs,
      },
    }
  })
  const taken = new Set(all.map((entry) => entry.item.path))

  // 2) routes Medusa skipped (empty object, function call, ...): read their config at runtime
  for (const { module, path } of extras) {
    const cfg = module && module.config
    if (!cfg || typeof cfg !== "object") continue

    const hasLabel = typeof cfg.label === "string" && cfg.label.length > 0
    const hasItems = Array.isArray(cfg.items) && cfg.items.length > 0
    if (!hasLabel && !hasItems) continue // no label -> not shown in the sidebar (same as Medusa)

    if (cfg.nested !== undefined && !__NESTED.includes(cfg.nested)) {
      console.error("${TAG} Invalid nested route position \\"" + cfg.nested + "\\" for " + path + ". Allowed: " + __NESTED.join(", "))
      continue
    }
    if (taken.has(path)) continue
    taken.add(path)

    all.push({
      cfg,
      item: {
        label: cfg.label,
        icon: cfg.icon,
        path,
        nested: cfg.nested,
        rank: typeof cfg.rank === "number" ? cfg.rank : undefined,
        translationNs: cfg.translationNs,
      },
    })
  }

  // 3) dynamic routes with \`items\`: one concrete sidebar entry per item
  const out = []
  for (const { cfg, item } of all) {
    const entries = cfg.items
    const match = item.path.match(/^(.*)\\/:[^/]+$/)

    if (!Array.isArray(entries) || !match || match[1].includes(":")) {
      out.push(item)
      continue
    }

    for (const entry of entries) {
      const path = match[1] + "/" + encodeURIComponent(entry.param)
      // an explicit static route/config for the same path wins
      if (taken.has(path)) continue
      taken.add(path)
      out.push({
        label: entry.label,
        icon: entry.icon,
        path,
        nested: undefined,
        rank: entry.rank ?? item.rank,
        translationNs: entry.translationNs ?? item.translationNs,
      })
    }
  }

  return out
}
`

export function expandDynamicMenuItems(options: ExpandDynamicMenuItemsOptions = {}) {
  const sources = options.sources ?? [path.resolve(process.cwd(), "src/admin")]
  let command: "build" | "serve" = "build"
  let seen = false

  return {
    name: "medusa-expand-dynamic-menu-items",
    enforce: "post",
    configResolved(config: any) {
      command = config.command
      say(`plugin active (vite ${command}, root: ${config.root}, sources: ${sources.join(", ")})`)
    },
    buildEnd() {
      if (command === "build" && !seen) {
        shout(
          "Never saw Medusa's menu-items module during this build, so nothing was expanded. " +
            "Check the Medusa version and that src/admin/routes/**/page.tsx files exist."
        )
      }
    },
    transform(code: string, id: string) {
      const cleanId = id.split("?")[0]
      const mode = cleanId === APP_MODULE ? "app" : PLUGIN_ENTRY.test(cleanId!) ? "plugin" : null
      if (!mode) return null
      seen = true

      const declaration = mode === "app" ? "export default {" : "const menuItemModule = {"
      const target = mode === "app" ? "__medusaMenuItems" : "menuItemModule"

      if (code.split(declaration).length !== 2) {
        // Medusa changed the generated shape: do nothing rather than break the admin.
        shout(
          `Unexpected ${mode} menu-items shape; skipping. ` +
            "Dynamic route items will NOT appear in the sidebar. " +
            "(Medusa likely changed its generated code.)"
        )
        return null
      }

      const extras = findUnparsedRoutes(code, sources)
      const dynamic = (code.match(/path: "[^"]*\/:[^"]*",\s*nested:/g) ?? []).length
      say(
        `${mode} menu-items module: ${dynamic} dynamic route(s) parsed by Medusa, ` +
          `${extras.length} extra route config(s) read at runtime` +
          (extras.length ? ` [${extras.map((e) => e.routePath || "/").join(", ")}]` : "")
      )

      let patched = code.replace(/label: (RouteConfig\d+)\.label,/g, "__config: $1,\n    $&")

      if (mode === "app") {
        patched = patched.replace(declaration, `const ${target} = {`)
      }

      const imports = extras.map((e, i) => `import * as __ExtraRoute${i} from ${JSON.stringify(e.file)}`)
      const registry = extras
        .map((e, i) => `{ module: __ExtraRoute${i}, path: ${JSON.stringify(e.routePath)} }`)
        .join(", ")

      // Mutate in place: in plugin mode `const plugin = { menuItemModule }` is defined
      // *after* this object, and holds a reference to it.
      patched =
        (imports.length ? imports.join("\n") + "\n" : "") +
        patched +
        `${HELPER}\n${target}.menuItems = __expandMenuItems(${target}.menuItems, [${registry}])\n`

      if (mode === "app") {
        patched += `export default ${target}\n`
      }

      return { code: patched, map: null }
    },
  }
}