/**
 * `layers/module-boundaries`: a reusable module (`packages/modules/<name>/src`)
 * only imports
 *   - its own files (relative, or its own `@repo/module-<name>/…` entries),
 *   - a declared dependency's `entities` entry (`@repo/module-<dep>/entities`),
 *   - platform and third-party packages,
 * and never a domain (`@repo/domain-*`) or a file outside its package.
 * Dependencies come from the module's `src/manifest.ts`
 * (`defineModuleManifest({ key, dependsOn: ["…"] })`, a literal array).
 * Type-only imports are allowed.
 */
import fs from "node:fs";
import path from "node:path";

const IN_PACKAGE = /^(.*\/packages\/modules\/([^/]+)\/src)(?=\/|$)/;
const MODULE_SPECIFIER = /^@repo\/module-([^/]+)(?:\/(.+))?$/;
const DOMAIN_SPECIFIER = /^@repo\/(domain|plugin)-/;

/** The module a path belongs to: its source root and package name. */
function moduleOf(file) {
  const pkg = file.split(path.sep).join("/").match(IN_PACKAGE);
  return pkg ? { root: pkg[1], name: pkg[2] } : null;
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

      if (DOMAIN_SPECIFIER.test(source)) {
        return fail(
          `Module "${mod.name}" imports a domain ("${source}"). Modules are reusable: cross-module logic belongs in the domain (workflows, hooks, queries).`,
        );
      }
      const pkg = source.match(MODULE_SPECIFIER);
      if (pkg) {
        const [, name, rest = ""] = pkg;
        if (name === mod.name) return;
        if (!deps.includes(name)) return fail(`Module "${mod.name}" doesn't declare a dependency on "${name}" (manifest.ts dependsOn).`);
        if (!isEntitiesEntry(rest)) return fail(`Module "${mod.name}" may only import "@repo/module-${name}/entities" (definitions), not "${source}".`);
        return;
      }
      if (!source.startsWith(".")) return;
      const target = path.resolve(path.dirname(filename), source).split(path.sep).join("/");
      if (target !== mod.root && !target.startsWith(`${mod.root}/`)) {
        return fail(`Module "${mod.name}" imports a file outside its package ("${source}"); use a package entry.`);
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
