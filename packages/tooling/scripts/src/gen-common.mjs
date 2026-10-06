// Shared helpers of the generators (gen-module, gen-domain).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
export const camel = (s) => pascal(s).replace(/^./, (c) => c.toLowerCase());
export const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/-/g, "_").toLowerCase();
export const kebab = (s) => snake(s).replace(/_/g, "-");
export const words = (s) => snake(s).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function cli(command, usage) {
  const fail = (message) => {
    console.error(`${command}: ${message}`);
    process.exit(1);
  };
  const args = process.argv.slice(2);
  const name = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
  const flag = (f) => (args.includes(`--${f}`) ? args[args.indexOf(`--${f}`) + 1] : undefined);
  if (!name) fail(`usage: ${usage}`);
  if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(`"${name}" must be kebab-case (e.g. "invoicing").`);
  return { name, flag, fail };
}

/** package.json of an existing workspace in `dir` (dependency versions). */
export function referencePackage(dir) {
  const root = path.join(repoRoot, dir);
  const ref = fs
    .readdirSync(root)
    .map((d) => path.join(root, d, "package.json"))
    .find((p) => fs.existsSync(p));
  return ref ? JSON.parse(fs.readFileSync(ref, "utf8")) : null;
}

export function writeFiles(target, files) {
  for (const [file, content] of Object.entries(files)) {
    const out = path.join(target, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, typeof content === "string" ? content : JSON.stringify(content, null, 2) + "\n");
  }
}

export const ESLINT_CONFIG = `import { config as baseConfig } from "@repo/config/eslint/base.js";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  { ignores: [".medusa/**", "dist/**", "node_modules/**"] },
];
`;

export const ENV_TEST = `DB_HOST=localhost
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=test-jwt-secret
COOKIE_SECRET=test-cookie-secret
`;
