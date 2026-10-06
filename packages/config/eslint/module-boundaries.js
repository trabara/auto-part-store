/**
 * `layers/module-boundaries`: a reusable module only imports
 *   - its own files,
 *   - a declared dependency's `entities` entry (isomorphic definitions),
 * and never its domain (the plugin's other folders) or another module's
 * internals. Dependencies come from the module's `manifest.ts`
 * (`defineModuleManifest({ key, dependsOn: ["…"] })`, a literal array).
 *
 * Modules live in `packages/plugins/<domain>/src/modules/<module>/` today and
 * in `packages/modules/<module>/src/` once extracted (imported as
 * `@repo/module-<module>/entities`). Type-only imports are allowed.
 */
import fs from "node:fs";
import path from "node:path";

const IN_PLUGIN = /^(.*\/packages\/plugins\/[^/]+\/src)\/modules\/([^/]+)(?=\/|$)/;
const IN_PACKAGE = /^(.*\/packages\/modules\/([^/]+)\/src)(?=\/|$)/;
const PACKAGE_SPECIFIER = /^@repo\/module-([^/]+)(?:\/(.+))?$/;

/** The module a path belongs to: its root folder, the domain's src (if any) and name. */
function moduleOf(file) {
  const p = file.split(path.sep).join("/");
  const plugin = p.match(IN_PLUGIN);
  if (plugin) return { root: `${plugin[1]}/modules/${plugin[2]}`, domainSrc: plugin[1], name: plugin[2] };
  const pkg = p.match(IN_PACKAGE);
  if (pkg) return { root: pkg[1], domainSrc: null, name: pkg[2] };
  return null;
}

const manifests = new Map();

/** `{ key, dependsOn }` parsed from `<root>/manifest.ts`, or null. */
function readManifest(root) {
  if (manifests.has(root)) return manifests.get(root);
  let manifest = null;
  try {
    const source = fs.readFileSync(`${root}/manifest.ts`, "utf8");
    const key = source.match(/key:\s*["']([^"']+)["']/)?.[1];
    const deps = source.match(/dependsOn:\s*\[([^\]]*)\]/)?.[1] ?? "";
    manifest = { key, dependsOn: [...deps.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]) };
  } catch {
    manifest = null;
  }
  manifests.set(root, manifest);
  return manifest;
}

const isEntitiesEntry = (rest) => rest === "entities" || rest === "entities/index";

export const moduleBoundaries = {
  meta: {
    type: "problem",
    docs: { description: "Reusable modules import only their own files and declared dependencies' entities." },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const mod = moduleOf(filename);
    if (!mod) return {};
    const manifest = readManifest(mod.root);
    const deps = manifest?.dependsOn ?? [];

    const check = (node, source, typeOnly) => {
      if (typeOnly || typeof source !== "string") return;
      const fail = (message) => context.report({ node, message });

      const pkg = source.match(PACKAGE_SPECIFIER);
      if (pkg) {
        const [, name, rest = ""] = pkg;
        if (name === mod.name) return;
        if (!deps.includes(name)) return fail(`Module "${mod.name}" doesn't declare a dependency on "${name}" (manifest.ts dependsOn).`);
        if (!isEntitiesEntry(rest)) return fail(`Module "${mod.name}" may only import "@repo/module-${name}/entities" (definitions), not "${source}".`);
        return;
      }
      if (!source.startsWith(".")) return;

      const target = path.resolve(path.dirname(filename), source).split(path.sep).join("/");
      if (target === mod.root || target.startsWith(`${mod.root}/`)) return;

      const other = moduleOf(target);
      if (other && other.domainSrc === mod.domainSrc) {
        const key = readManifest(other.root)?.key ?? other.name;
        const rest = path.posix.relative(other.root, target);
        if (!deps.includes(key)) {
          return fail(`Module "${mod.name}" doesn't declare a dependency on "${key}" (manifest.ts dependsOn).`);
        }
        if (!isEntitiesEntry(rest)) {
          return fail(`Module "${mod.name}" may only import "${key}"'s entities entry (definitions), not "${source}".`);
        }
        return;
      }
      if (mod.domainSrc && target.startsWith(`${mod.domainSrc}/`)) {
        return fail(
          `Module "${mod.name}" imports domain code ("${source}"). Modules are reusable: cross-module logic belongs in the domain (workflows, hooks, queries).`,
        );
      }
    };

    return {
      Program(node) {
        if (!manifest) context.report({ node, message: `Module "${mod.name}" has no manifest.ts (defineModuleManifest).` });
      },
      ImportDeclaration: (node) => check(node, node.source.value, node.importKind === "type"),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value, node.exportKind === "type"),
      ExportAllDeclaration: (node) => check(node, node.source.value, node.exportKind === "type"),
      ImportExpression: (node) => node.source.type === "Literal" && check(node, node.source.value, false),
    };
  },
};

export default moduleBoundaries;
