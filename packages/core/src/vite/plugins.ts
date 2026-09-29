/**
 * Expands a dynamic route's `items` config into one sidebar entry per item.
 *
 *   routes/automotive/[feature]/page.tsx
 *   defineRouteConfig({ label: "...", items: [{ param: "vehicle", label: "Vehicles" }] })
 *     -> sidebar item "Vehicles" -> /automotive/vehicle
 *
 * Works in both places Medusa generates menu items:
 *  - application: the `virtual:medusa/menu-items` module (via `admin.vite` in medusa-config.ts)
 *  - plugin:      the `src/admin/__admin-extensions__.js` entry built by `medusa plugin:build`
 *                 (via a `vite.config.ts` at the plugin root)
 */

const APP_MODULE = "\0virtual:medusa/menu-items";
const PLUGIN_ENTRY = /[\\/]src[\\/]admin[\\/]__admin-extensions__\.js$/;

const HELPER = /* js */ `
const __expandMenuItems = (menuItems) => {
  const taken = new Set(menuItems.map((i) => i.path))
  const out = []

  for (const { __config, ...item } of menuItems) {
    const entries = __config?.items
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
`;

const TAG = "[expand-dynamic-menu-items]";
const debug = Boolean(process.env.EXPAND_DEBUG);
// Medusa runs plugin builds with Vite's logLevel "silent", which swallows this.warn().
// console.* is not affected, so use it for anything the developer must see.
const say = (message: string) => debug && console.log(`${TAG} ${message}`);
const shout = (message: string) => console.warn(`${TAG} ${message}`);

export function expandDynamicMenuItems() {
  let command: "build" | "serve" = "build";
  let seen = false;

  return {
    name: "medusa-expand-dynamic-menu-items",
    enforce: "post",
    configResolved(config: any) {
      command = config.command;
      say(`plugin active (vite ${command}, root: ${config.root})`);
    },
    buildEnd() {
      if (command === "build" && !seen) {
        shout(
          "Never saw Medusa's menu-items module during this build, so nothing was expanded. " +
            "Check the Medusa version and that src/admin/routes/**/page.tsx files exist.",
        );
      }
    },
    transform(code: string, id: string) {
      const cleanId = id.split("?")[0];
      const mode =
        cleanId === APP_MODULE
          ? "app"
          : PLUGIN_ENTRY.test(cleanId)
            ? "plugin"
            : null;
      if (!mode) return null;
      seen = true;

      const declaration =
        mode === "app" ? "export default {" : "const menuItemModule = {";
      const target = mode === "app" ? "__medusaMenuItems" : "menuItemModule";

      const hasDeclaration = code.split(declaration).length === 2;
      const hasLabelRefs = /label: RouteConfig\d+\.label,/.test(code);

      if (hasDeclaration && !hasLabelRefs) {
        // Expected shape, but no page.tsx exports a config with a label.
        shout(
          "No sidebar-enabled routes found (no page.tsx exports defineRouteConfig with a label); " +
            "nothing to expand.",
        );
        return null;
      }

      if (!hasDeclaration) {
        // Medusa changed the generated shape: do nothing rather than break the admin.
        shout(
          `Unexpected ${mode} menu-items shape; skipping. ` +
            "Dynamic route items will NOT appear in the sidebar. " +
            "(Medusa likely changed its generated code.)",
        );
        return null;
      }

      let patched = code.replace(
        /label: (RouteConfig\d+)\.label,/g,
        "__config: $1,\n    $&",
      );

      if (mode === "app") {
        patched = patched.replace(declaration, `const ${target} = {`);
      }

      // Mutate in place: in plugin mode `const plugin = { menuItemModule }` is defined
      // *after* this object, and holds a reference to it.
      patched += `${HELPER}\n${target}.menuItems = __expandMenuItems(${target}.menuItems)\n`;

      if (mode === "app") {
        patched += `export default ${target}\n`;
      }

      const dynamic = (code.match(/path: "[^"]*\/:[^"]*",\s*nested:/g) ?? [])
        .length;
      say(
        `patched ${mode} menu-items module (${dynamic} dynamic route(s) eligible for expansion)`,
      );

      return { code: patched, map: null };
    },
  };
}
